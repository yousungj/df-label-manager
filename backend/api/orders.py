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
            
            if priority not in ['normal', 'high', 'urgent']:
                return response(400, {'error': 'Invalid priority value'})
            
            # Get order to find batch_id
            # In production, you'd store batch_id mapping or pass it
            # For simplicity, we'll need to query
            from db import get_orders_table
            from boto3.dynamodb.conditions import Key
            
            table = get_orders_table()
            resp = table.query(
                KeyConditionExpression=Key('order_id').eq(order_id),
                Limit=1
            )
            
            if not resp.get('Items'):
                return response(404, {'error': 'Order not found'})
            
            order = resp['Items'][0]
            batch_id = order['batch_id']
            
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
            
            # Get order to find batch_id
            from db import get_orders_table
            from boto3.dynamodb.conditions import Key
            
            table = get_orders_table()
            resp = table.query(
                KeyConditionExpression=Key('order_id').eq(order_id),
                Limit=1
            )
            
            if not resp.get('Items'):
                return response(404, {'error': 'Order not found'})
            
            order = resp['Items'][0]
            batch_id = order['batch_id']
            
            updates = {
                'ship_confirmed_at': get_current_timestamp(),
                'updated_at': get_current_timestamp()
            }
            
            updated_order = update_order(order_id, batch_id, updates)
            return response(200, {'data': updated_order})
        
        # POST /orders/bulk-ship-confirm
        if http_method == 'POST' and 'bulk-ship-confirm' in path:
            body = json.loads(event.get('body', '{}'))
            order_ids = body.get('order_ids', [])
            
            if not order_ids:
                return response(400, {'error': 'Missing order_ids'})
            
            from db import get_orders_table
            from boto3.dynamodb.conditions import Key
            
            table = get_orders_table()
            confirmed_count = 0
            timestamp = get_current_timestamp()
            
            for order_id in order_ids:
                resp = table.query(
                    KeyConditionExpression=Key('order_id').eq(order_id),
                    Limit=1
                )
                
                if resp.get('Items'):
                    order = resp['Items'][0]
                    batch_id = order['batch_id']
                    
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
            
            # Get order to find batch_id
            from db import get_orders_table
            from boto3.dynamodb.conditions import Key
            
            table = get_orders_table()
            resp = table.query(
                KeyConditionExpression=Key('order_id').eq(order_id),
                Limit=1
            )
            
            if not resp.get('Items'):
                return response(404, {'error': 'Order not found'})
            
            order = resp['Items'][0]
            batch_id = order['batch_id']
            
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
