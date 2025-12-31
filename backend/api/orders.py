# Orders API Lambda Handler

import json
import logging
import sys

# Add shared modules to path
sys.path.append('/opt/python')

from models import get_current_timestamp
from db import list_orders_by_batch, get_order, update_order

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
    API Gateway Lambda for order operations
    
    Routes:
    - GET /batches/{batch_id}/orders - List orders in batch
    - PATCH /orders/{order_id}/priority - Update print priority
    - POST /orders/{order_id}/ship-confirm - Ship confirm single order
    - POST /orders/bulk-ship-confirm - Ship confirm multiple orders
    - PATCH /orders/{order_id}/tracking - Update tracking number
    """
    logger.info(f"Event: {json.dumps(event)}")
    
    http_method = event.get('httpMethod', '')
    path = event.get('path', '')
    path_params = event.get('pathParameters', {}) or {}
    
    try:
        # OPTIONS request for CORS
        if http_method == 'OPTIONS':
            return response(200, {})
        
        # GET /batches/{batch_id}/orders
        if http_method == 'GET' and '/orders' in path:
            batch_id = path_params.get('batch_id') or path_params.get('id')
            if not batch_id:
                return response(400, {'error': 'Missing batch_id'})
            
            orders = list_orders_by_batch(batch_id)
            
            return response(200, {
                'items': orders,
                'total': len(orders),
                'page': 1,
                'per_page': len(orders),
                'has_more': False
            })
        
        # PATCH /orders/{order_id}/priority
        if http_method == 'PATCH' and 'priority' in path:
            order_id = path_params.get('id')
            if not order_id:
                return response(400, {'error': 'Missing order_id'})
            
            body = json.loads(event.get('body', '{}'))
            priority = body.get('priority')
            batch_id = body.get('batch_id')
            
            if priority not in ['normal', 'high', 'urgent']:
                return response(400, {'error': 'Invalid priority value'})
            
            if not batch_id:
                return response(400, {'error': 'Missing batch_id in request body'})
            
            # Verify order exists
            order = get_order(order_id, batch_id)
            if not order:
                return response(404, {'error': 'Order not found'})
            
            updates = {
                'print_priority': priority,
                'updated_at': get_current_timestamp()
            }
            
            updated_order = update_order(order_id, batch_id, updates)
            return response(200, {'data': updated_order})
        
        # POST /orders/{order_id}/ship-confirm
        if http_method == 'POST' and 'ship-confirm' in path and 'bulk' not in path:
            order_id = path_params.get('id')
            if not order_id:
                return response(400, {'error': 'Missing order_id'})
            
            # Get batch_id from request body
            body = json.loads(event.get('body', '{}'))
            batch_id = body.get('batch_id')
            
            if not batch_id:
                return response(400, {'error': 'Missing batch_id in request body'})
            
            # Verify order exists
            order = get_order(order_id, batch_id)
            if not order:
                return response(404, {'error': 'Order not found'})
            
            updates = {
                'ship_confirmed_at': get_current_timestamp(),
                'updated_at': get_current_timestamp()
            }
            
            updated_order = update_order(order_id, batch_id, updates)
            return response(200, {'data': updated_order})
        
        # POST /orders/bulk-ship-confirm
        if http_method == 'POST' and 'bulk-ship-confirm' in path:
            body = json.loads(event.get('body', '{}'))
            orders_list = body.get('orders', [])  # Expecting [{order_id, batch_id}, ...]
            
            if not orders_list:
                return response(400, {'error': 'Missing orders list'})
            
            confirmed_count = 0
            timestamp = get_current_timestamp()
            
            for order_info in orders_list:
                order_id = order_info.get('order_id')
                batch_id = order_info.get('batch_id')
                
                if not order_id or not batch_id:
                    continue
                
                # Verify order exists
                order = get_order(order_id, batch_id)
                if order and not order.get('ship_confirmed_at'):
                    update_order(order_id, batch_id, {
                        'ship_confirmed_at': timestamp,
                        'updated_at': timestamp
                    })
                    confirmed_count += 1
            
            return response(200, {
                'data': {'confirmed_count': confirmed_count}
            })
        
        # PATCH /orders/{order_id}/tracking
        if http_method == 'PATCH' and 'tracking' in path:
            order_id = path_params.get('id')
            if not order_id:
                return response(400, {'error': 'Missing order_id'})
            
            body = json.loads(event.get('body', '{}'))
            tracking_number = body.get('tracking_number')
            
            if not tracking_number:
                return response(400, {'error': 'Missing tracking_number'})
            
            # Get batch_id from request body
            batch_id = body.get('batch_id')
            
            if not batch_id:
                return response(400, {'error': 'Missing batch_id in request body'})
            
            # Verify order exists
            order = get_order(order_id, batch_id)
            if not order:
                return response(404, {'error': 'Order not found'})
            
            updates = {
                'tracking_number': tracking_number,
                'updated_at': get_current_timestamp()
            }
            
            updated_order = update_order(order_id, batch_id, updates)
            return response(200, {'data': updated_order})
        
        return response(404, {'error': 'Route not found'})
    
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        return response(500, {'error': str(e)})
