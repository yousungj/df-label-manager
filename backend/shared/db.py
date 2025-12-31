# DynamoDB helper functions

import boto3
from boto3.dynamodb.conditions import Key, Attr
from typing import List, Dict, Optional, Any
import os

dynamodb = boto3.resource('dynamodb')


def get_batches_table():
    """Get LabelBatches table"""
    table_name = os.environ.get('DYNAMODB_TABLE_BATCHES', 'LabelBatches')
    return dynamodb.Table(table_name)


def get_orders_table():
    """Get DFOrders table"""
    table_name = os.environ.get('DYNAMODB_TABLE_ORDERS', 'DFOrders')
    return dynamodb.Table(table_name)


def create_batch(batch_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new batch record"""
    table = get_batches_table()
    table.put_item(Item=batch_data)
    return batch_data


def get_batch(batch_id: str) -> Optional[Dict[str, Any]]:
    """Get a batch by ID"""
    table = get_batches_table()
    response = table.get_item(Key={'batch_id': batch_id})
    return response.get('Item')


def update_batch(batch_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update a batch"""
    table = get_batches_table()
    
    update_expr = 'SET ' + ', '.join([f'#{k} = :{k}' for k in updates.keys()])
    expr_attr_names = {f'#{k}': k for k in updates.keys()}
    expr_attr_values = {f':{k}': v for k, v in updates.items()}
    
    response = table.update_item(
        Key={'batch_id': batch_id},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_attr_names,
        ExpressionAttributeValues=expr_attr_values,
        ReturnValues='ALL_NEW'
    )
    return response.get('Attributes', {})


def list_batches(filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """List batches with optional filters"""
    table = get_batches_table()
    
    if filters and filters.get('shipping_service'):
        # Use GSI for shipping service
        response = table.query(
            IndexName='ShippingServiceIndex',
            KeyConditionExpression=Key('shipping_service').eq(filters['shipping_service'])
        )
    else:
        response = table.scan()
    
    items = response.get('Items', [])
    
    # Apply additional filters
    if filters:
        if filters.get('status') == 'unprinted':
            items = [i for i in items if not i.get('batch_printed_at')]
        elif filters.get('status') == 'unconfirmed':
            items = [i for i in items if not i.get('batch_confirmed_at')]
    
    return items


def create_order(order_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new order record"""
    table = get_orders_table()
    table.put_item(Item=order_data)
    return order_data


def get_order(order_id: str, batch_id: str) -> Optional[Dict[str, Any]]:
    """Get an order by ID"""
    table = get_orders_table()
    response = table.get_item(Key={'order_id': order_id, 'batch_id': batch_id})
    return response.get('Item')


def update_order(order_id: str, batch_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update an order"""
    table = get_orders_table()
    
    update_expr = 'SET ' + ', '.join([f'#{k} = :{k}' for k in updates.keys()])
    expr_attr_names = {f'#{k}': k for k in updates.keys()}
    expr_attr_values = {f':{k}': v for k, v in updates.items()}
    
    response = table.update_item(
        Key={'order_id': order_id, 'batch_id': batch_id},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_attr_names,
        ExpressionAttributeValues=expr_attr_values,
        ReturnValues='ALL_NEW'
    )
    return response.get('Attributes', {})


def list_orders_by_batch(batch_id: str) -> List[Dict[str, Any]]:
    """List all orders in a batch"""
    table = get_orders_table()
    response = table.query(
        IndexName='BatchIndex',
        KeyConditionExpression=Key('batch_id').eq(batch_id)
    )
    return response.get('Items', [])


def batch_check_exists(batch_file_name: str) -> bool:
    """
    Check if a batch with the given filename already exists
    
    Note: This uses scan which is inefficient. Consider:
    1. Adding a GSI with batch_file_name as partition key
    2. Using a separate index/cache for filenames
    3. Using a naming convention that includes unique identifiers
    """
    table = get_batches_table()
    # Limit scan to minimize cost - if we find one match, that's enough
    response = table.scan(
        FilterExpression=Attr('batch_file_name').eq(batch_file_name),
        Limit=1
    )
    return len(response.get('Items', [])) > 0
