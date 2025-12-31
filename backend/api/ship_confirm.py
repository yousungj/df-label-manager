# Ship Confirmation Handler

import json
import logging
import sys

# Add shared modules to path
sys.path.append('/opt/python')

from models import get_current_timestamp
from db import update_order

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def ship_confirm_order(order_id: str, batch_id: str, confirmed_by: str = None):
    """
    Ship confirm a single order
    
    This function:
    1. Updates DynamoDB with confirmation timestamp
    2. Optionally uploads confirmation file to SFTP (if required by Amazon)
    3. Logs the confirmation action
    """
    timestamp = get_current_timestamp()
    
    updates = {
        'ship_confirmed_at': timestamp,
        'updated_at': timestamp
    }
    
    if confirmed_by:
        updates['confirmed_by'] = confirmed_by
    
    updated_order = update_order(order_id, batch_id, updates)
    
    logger.info(f"Ship confirmed order {order_id} in batch {batch_id}")
    
    # TODO: Upload confirmation to SFTP if required
    # upload_confirmation_to_sftp(order_id, timestamp)
    
    return updated_order


def upload_confirmation_to_sftp(order_id: str, confirmation_time: str):
    """
    Upload ship confirmation file to SFTP (if required by Amazon)
    
    This is a placeholder for future implementation.
    Amazon may require confirmation files to be uploaded back to SFTP.
    """
    # Implementation would:
    # 1. Create confirmation file (CSV or XML format)
    # 2. Connect to SFTP
    # 3. Upload to /inbound/confirmations/ or similar
    pass


def handler(event, context):
    """
    Direct invocation handler for ship confirmation
    Can be called by other Lambda functions
    """
    logger.info(f"Event: {json.dumps(event)}")
    
    order_id = event.get('order_id')
    batch_id = event.get('batch_id')
    confirmed_by = event.get('confirmed_by')
    
    if not order_id or not batch_id:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing order_id or batch_id'})
        }
    
    try:
        updated_order = ship_confirm_order(order_id, batch_id, confirmed_by)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Order ship confirmed',
                'order': updated_order
            })
        }
    
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
