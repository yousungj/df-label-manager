# S3 helper functions

import boto3
import os
from typing import Optional

s3_client = boto3.client('s3')


def get_bucket_name() -> str:
    """Get S3 bucket name from environment"""
    return os.environ.get('S3_BUCKET', 'df-labels-bucket')


def upload_file(file_path: str, s3_key: str) -> str:
    """Upload a file to S3 and return the S3 URL"""
    bucket = get_bucket_name()
    s3_client.upload_file(file_path, bucket, s3_key)
    return f's3://{bucket}/{s3_key}'


def upload_file_obj(file_obj, s3_key: str) -> str:
    """Upload a file object to S3 and return the S3 URL"""
    bucket = get_bucket_name()
    s3_client.upload_fileobj(file_obj, bucket, s3_key)
    return f's3://{bucket}/{s3_key}'


def generate_presigned_url(s3_key: str, expiration: int = 3600) -> str:
    """Generate a presigned URL for an S3 object"""
    bucket = get_bucket_name()
    url = s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket, 'Key': s3_key},
        ExpiresIn=expiration
    )
    return url


def get_s3_key_from_url(s3_url: str) -> str:
    """Extract S3 key from S3 URL"""
    # s3://bucket/key -> key
    if s3_url.startswith('s3://'):
        parts = s3_url.replace('s3://', '').split('/', 1)
        return parts[1] if len(parts) > 1 else ''
    return s3_url


def file_exists(s3_key: str) -> bool:
    """Check if a file exists in S3"""
    bucket = get_bucket_name()
    try:
        s3_client.head_object(Bucket=bucket, Key=s3_key)
        return True
    except:
        return False
