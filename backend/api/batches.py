# Batches API Lambda Handler

import json
import logging
import os
import sys

# Add shared modules to path
sys.path.append('/opt/python')

from models import get_current_timestamp
from db import list_batches, get_batch, update_batch, list_orders_by_batch
from s3 import get_s3_key_from_url, generate_presigned_url

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def cors_headers():
    """Return CORS headers"""
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    }


def response(status_code, body):
    """Create API Gateway response"""
    return {
        'statusCode': status_code,
        'headers': cors_headers(),
        'body': json.dumps(body)
    }


def handler(event, context):
    """
    API Gateway Lambda for batch operations
    
    Routes:
    - GET /batches - List batches
    - GET /batches/{batch_id} - Get batch details
    - PATCH /batches/{batch_id}/mark-printed - Mark batch as printed
    - POST /batches/{batch_id}/ship-confirm - Ship confirm all orders in batch
    - GET /batches/{batch_id}/pdf - Get presigned PDF URL
    """
    logger.info(f"Event: {json.dumps(event)}")
    
    http_method = event.get('httpMethod', '')
    path = event.get('path', '')
    path_params = event.get('pathParameters', {}) or {}
    query_params = event.get('queryStringParameters', {}) or {}
    
    try:
        # OPTIONS request for CORS
        if http_method == 'OPTIONS':
            return response(200, {})
        
        # GET /batches - List batches
        if http_method == 'GET' and path == '/batches':
            filters = {}
            if query_params.get('shipping_service'):
                filters['shipping_service'] = query_params['shipping_service']
            if query_params.get('status'):
                filters['status'] = query_params['status']
            
            batches = list_batches(filters)
            
            return response(200, {
                'items': batches,
                'total': len(batches),
                'page': 1,
                'per_page': len(batches),
                'has_more': False
            })
        
        # GET /batches/{batch_id} - Get batch details
        if http_method == 'GET' and '/batches/' in path and not path.endswith('/pdf'):
            batch_id = path_params.get('id')
            if not batch_id:
                return response(400, {'error': 'Missing batch_id'})
            
            batch = get_batch(batch_id)
            if not batch:
                return response(404, {'error': 'Batch not found'})
            
            return response(200, {'data': batch})
        
        # PATCH /batches/{batch_id}/mark-printed
        if http_method == 'PATCH' and 'mark-printed' in path:
            batch_id = path_params.get('id')
            if not batch_id:
                return response(400, {'error': 'Missing batch_id'})
            
            updates = {
                'batch_printed_at': get_current_timestamp(),
                'updated_at': get_current_timestamp()
            }
            
            updated_batch = update_batch(batch_id, updates)
            return response(200, {'data': updated_batch})
        
        # POST /batches/{batch_id}/ship-confirm
        if http_method == 'POST' and 'ship-confirm' in path:
            batch_id = path_params.get('id')
            if not batch_id:
                return response(400, {'error': 'Missing batch_id'})
            
            # Get all orders in batch
            orders = list_orders_by_batch(batch_id)
            
            # Import here to avoid circular dependency
            from db import update_order
            
            # Update each unconfirmed order
            confirmed_count = 0
            timestamp = get_current_timestamp()
            
            for order in orders:
                if not order.get('ship_confirmed_at'):
                    update_order(
                        order['order_id'],
                        batch_id,
                        {
                            'ship_confirmed_at': timestamp,
                            'updated_at': timestamp
                        }
                    )
                    confirmed_count += 1
            
            # Update batch
            update_batch(batch_id, {
                'batch_confirmed_at': timestamp,
                'updated_at': timestamp
            })
            
            return response(200, {
                'data': {'confirmed_count': confirmed_count}
            })
        
        # GET /batches/{batch_id}/pdf
        if http_method == 'GET' and path.endswith('/pdf'):
            batch_id = path_params.get('id')
            if not batch_id:
                return response(400, {'error': 'Missing batch_id'})
            
            batch = get_batch(batch_id)
            if not batch:
                return response(404, {'error': 'Batch not found'})
            
            s3_url = batch.get('s3_url')
            if not s3_url:
                return response(404, {'error': 'PDF not found'})
            
            s3_key = get_s3_key_from_url(s3_url)
            presigned_url = generate_presigned_url(s3_key)
            
            return response(200, {'data': {'url': presigned_url}})
        
        return response(404, {'error': 'Route not found'})
    
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        return response(500, {'error': str(e)})
