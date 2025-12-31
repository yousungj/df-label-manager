# PDF Parser for extracting order information from label PDFs

import io
import re
from typing import Dict, List, Any
import PyPDF2


def parse_pdf_metadata(filename: str, pdf_content: io.BytesIO) -> Dict[str, Any]:
    """
    Extract metadata from PDF filename and content
    
    Filename format examples:
    - UPS_Labels_20240101_123456.pdf
    - FedEx_Labels_20240101.pdf
    - USPS_Batch_123.pdf
    """
    # Parse shipping service from filename
    shipping_service = 'Unknown'
    if filename.upper().startswith('UPS'):
        shipping_service = 'UPS'
    elif filename.upper().startswith('FEDEX'):
        shipping_service = 'FedEx'
    elif filename.upper().startswith('USPS'):
        shipping_service = 'USPS'
    
    return {
        'shipping_service': shipping_service,
        'filename': filename
    }


def parse_pdf_orders(pdf_content: io.BytesIO) -> List[Dict[str, Any]]:
    """
    Parse orders from PDF content
    
    This is a simplified implementation. In production, you would:
    1. Use actual PDF parsing to extract order information
    2. Or use Amazon SP-API to fetch order details
    3. Or extract from barcode/QR codes in the PDF
    
    For now, we'll extract basic info and generate placeholder orders
    """
    orders = []
    
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_content)
        num_pages = len(pdf_reader.pages)
        
        # Simple heuristic: assume 1 page = 1 order (typical for shipping labels)
        # In production, you'd parse actual order data from the PDF text
        for page_num in range(num_pages):
            page = pdf_reader.pages[page_num]
            text = page.extract_text()
            
            # Try to extract order ID and PO number from text
            # This is a simplified regex - adjust based on actual label format
            order_id_match = re.search(r'Order[:\s]+([A-Z0-9-]+)', text, re.IGNORECASE)
            po_match = re.search(r'PO[:\s]+([A-Z0-9-]+)', text, re.IGNORECASE)
            
            order_id = order_id_match.group(1) if order_id_match else f'ORDER-{page_num + 1:04d}'
            po_number = po_match.group(1) if po_match else f'PO-{page_num + 1:04d}'
            
            orders.append({
                'order_id': order_id,
                'po_number': po_number,
                'order_date': '',  # Would extract from PDF or API
            })
    
    except Exception as e:
        # If PDF parsing fails, create a single placeholder order
        orders.append({
            'order_id': 'ORDER-0001',
            'po_number': 'PO-0001',
            'order_date': '',
        })
    
    return orders if orders else [{
        'order_id': 'ORDER-0001',
        'po_number': 'PO-0001',
        'order_date': '',
    }]
