# Data models for DF Label Manager

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional


@dataclass
class LabelBatch:
    """Represents a batch of shipping labels"""
    batch_id: str
    batch_file_name: str
    shipping_service: str
    s3_url: str
    downloaded_at: str
    total_orders: int
    created_at: str
    updated_at: str
    batch_printed_at: Optional[str] = None
    batch_confirmed_at: Optional[str] = None

    def to_dict(self):
        """Convert to dictionary for DynamoDB"""
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class DFOrder:
    """Represents a Direct Fulfillment order"""
    order_id: str
    batch_id: str
    purchase_order_number: str
    order_date: str
    shipping_service: str
    print_priority: str  # normal, high, urgent
    created_at: str
    updated_at: str
    ship_confirmed_at: Optional[str] = None
    confirmed_by: Optional[str] = None
    tracking_number: Optional[str] = None
    marked_printed_at: Optional[str] = None

    def to_dict(self):
        """Convert to dictionary for DynamoDB"""
        return {k: v for k, v in asdict(self).items() if v is not None}


def get_current_timestamp() -> str:
    """Get current timestamp in ISO format"""
    return datetime.utcnow().isoformat() + 'Z'
