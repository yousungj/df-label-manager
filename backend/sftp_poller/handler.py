# SFTP Poller Lambda Handler
# Polls SFTP server for new label files and processes them

import os
import json
import logging
from datetime import datetime
import uuid
from sftp_client import SFTPClient
from pdf_parser import parse_pdf_metadata, parse_pdf_orders

# Add shared modules to path
import sys
sys.path.append('/opt/python')

from models import LabelBatch, DFOrder, get_current_timestamp
from db import create_batch, create_order, batch_check_exists
from s3 import upload_file_obj

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    """
    EventBridge scheduled Lambda that polls SFTP for new label files
    """
    logger.info("Starting SFTP poller")
    
    sftp_host = os.environ.get('SFTP_HOST')
    sftp_port = int(os.environ.get('SFTP_PORT', '22'))
    sftp_user = os.environ.get('SFTP_USER')
    sftp_password = os.environ.get('SFTP_PASSWORD')
    
    if not all([sftp_host, sftp_user, sftp_password]):
        logger.error("Missing SFTP credentials")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Missing SFTP credentials'})
        }
    
    processed_files = []
    errors = []
    
    try:
        # Connect to SFTP
        with SFTPClient(sftp_host, sftp_port, sftp_user, sftp_password) as sftp:
            # List files in the labels directory
            remote_dir = '/outbound/labels/'
            files = sftp.list_files(remote_dir)
            
            logger.info(f"Found {len(files)} files in {remote_dir}")
            
            for file_info in files:
                filename = file_info['filename']
                
                # Skip if not a PDF
                if not filename.lower().endswith('.pdf'):
                    continue
                
                # Check if already processed
                if batch_check_exists(filename):
                    logger.info(f"Skipping already processed file: {filename}")
                    continue
                
                try:
                    # Download file
                    logger.info(f"Downloading {filename}")
                    file_content = sftp.download_file(f"{remote_dir}{filename}")
                    
                    # Parse metadata from filename and PDF
                    metadata = parse_pdf_metadata(filename, file_content)
                    shipping_service = metadata['shipping_service']
                    
                    # Upload to S3
                    s3_key = f"{shipping_service.lower()}/{filename}"
                    s3_url = upload_file_obj(file_content, s3_key)
                    logger.info(f"Uploaded to S3: {s3_url}")
                    
                    # Parse orders from PDF
                    orders_data = parse_pdf_orders(file_content)
                    
                    # Create batch record
                    batch_id = str(uuid.uuid4())
                    timestamp = get_current_timestamp()
                    
                    batch = LabelBatch(
                        batch_id=batch_id,
                        batch_file_name=filename,
                        shipping_service=shipping_service,
                        s3_url=s3_url,
                        downloaded_at=timestamp,
                        total_orders=len(orders_data),
                        created_at=timestamp,
                        updated_at=timestamp
                    )
                    
                    create_batch(batch.to_dict())
                    logger.info(f"Created batch: {batch_id}")
                    
                    # Create order records
                    for order_data in orders_data:
                        order = DFOrder(
                            order_id=order_data['order_id'],
                            batch_id=batch_id,
                            purchase_order_number=order_data.get('po_number', ''),
                            order_date=order_data.get('order_date', timestamp),
                            shipping_service=shipping_service,
                            print_priority='normal',
                            created_at=timestamp,
                            updated_at=timestamp
                        )
                        create_order(order.to_dict())
                    
                    logger.info(f"Created {len(orders_data)} orders for batch {batch_id}")
                    processed_files.append(filename)
                    
                except Exception as e:
                    logger.error(f"Error processing file {filename}: {str(e)}")
                    errors.append({'file': filename, 'error': str(e)})
    
    except Exception as e:
        logger.error(f"SFTP connection error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'SFTP error: {str(e)}'})
        }
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': len(processed_files),
            'files': processed_files,
            'errors': errors
        })
    }
