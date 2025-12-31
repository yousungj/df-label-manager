# DF Label Manager

A complete full-stack application for managing Amazon Direct Fulfillment (DF) shipping labels with improved UI/UX.

## 📋 Overview

DF Label Manager is a production-ready system that automates the processing of Amazon Direct Fulfillment shipping labels. Labels are downloaded from SFTP, stored in S3, tracked in DynamoDB, and managed through a modern Next.js web interface.

### Features

- 📦 **Automated SFTP Polling**: Downloads new label batches every 5 minutes
- 🏷️ **Batch Management**: Track batches by shipping service (UPS, FedEx, USPS)
- ✅ **Ship Confirmation**: Confirm shipments individually or in bulk
- 🎯 **Priority Management**: Set print priorities (normal, high, urgent)
- 📊 **Real-time Dashboard**: Modern UI for viewing and managing labels
- 🔒 **Secure**: AWS-native security with IAM, encrypted S3, and HTTPS
- 📈 **Monitored**: CloudWatch dashboards and alarms

## 🏗️ Architecture

```
┌─────────────┐
│    SFTP     │
│   Server    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│              EventBridge (every 5 min)              │
└──────────────────────┬──────────────────────────────┘
                       ▼
              ┌────────────────┐
              │  SFTP Poller   │
              │    Lambda      │
              └───────┬────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
   ┌─────────┐              ┌──────────────┐
   │   S3    │              │  DynamoDB    │
   │ Labels  │              │   Tables     │
   └─────────┘              └──────┬───────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
              ┌──────────┐                ┌──────────┐
              │ Batches  │                │  Orders  │
              │   API    │                │   API    │
              └────┬─────┘                └────┬─────┘
                   │                           │
                   └───────────┬───────────────┘
                               ▼
                      ┌─────────────────┐
                      │  API Gateway    │
                      └────────┬────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │   CloudFront    │
                      │   + Next.js     │
                      └─────────────────┘
```

## 📁 Project Structure

```
df-label-manager/
├── frontend/                      # Next.js 14 application
│   ├── app/
│   │   ├── page.tsx              # Main dashboard
│   │   ├── layout.tsx            # Root layout
│   │   └── batches/[id]/
│   │       └── page.tsx          # Batch detail page
│   ├── components/               # React components
│   ├── lib/
│   │   ├── api.ts               # API client
│   │   └── types.ts             # TypeScript types
│   └── package.json
│
├── backend/                      # Python Lambda functions
│   ├── sftp_poller/             # SFTP polling Lambda
│   ├── api/                     # API Lambda functions
│   ├── shared/                  # Shared utilities
│   │   ├── db.py               # DynamoDB helpers
│   │   ├── s3.py               # S3 helpers
│   │   └── models.py           # Data models
│   └── layers/common/          # Lambda layer
│
├── infrastructure/              # AWS CDK (TypeScript)
│   ├── lib/
│   │   ├── database-stack.ts   # DynamoDB tables
│   │   ├── storage-stack.ts    # S3 buckets
│   │   ├── lambda-stack.ts     # Lambda functions
│   │   ├── api-stack.ts        # API Gateway
│   │   ├── frontend-stack.ts   # CloudFront + S3
│   │   └── monitoring-stack.ts # CloudWatch
│   └── bin/app.ts              # CDK entry point
│
└── package.json                 # Root monorepo scripts
```

## 🚀 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **AWS CLI** configured with appropriate credentials
- **AWS CDK** 2.100.0+
- **SFTP** credentials for Amazon Direct Fulfillment

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/df-label-manager.git
cd df-label-manager
```

### 2. Install Dependencies

```bash
# Install all dependencies (root, frontend, infrastructure)
npm run install:all
```

### 3. Configure Environment Variables

#### Backend SFTP Configuration

```bash
cd backend/sftp_poller
cp .env.example .env
# Edit .env with your SFTP credentials
```

Example `.env`:
```
SFTP_HOST=your-sftp-host.com
SFTP_PORT=22
SFTP_USER=your-username
SFTP_PASSWORD=your-password
S3_BUCKET=df-labels-bucket
DYNAMODB_TABLE_BATCHES=LabelBatches
DYNAMODB_TABLE_ORDERS=DFOrders
```

#### Frontend Configuration

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your API Gateway URL (after deployment)
```

Example `.env.local`:
```
NEXT_PUBLIC_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/prod
```

## 🚢 Deployment

### Deploy Infrastructure (AWS CDK)

```bash
# Bootstrap CDK (first time only)
cd infrastructure
npx cdk bootstrap

# Review changes
npm run cdk:diff

# Deploy all stacks
npm run cdk:deploy

# Note the API Gateway URL from the output
```

The deployment will create:
- DynamoDB tables (LabelBatches, DFOrders)
- S3 buckets (labels, frontend)
- Lambda functions (SFTP poller, API handlers)
- API Gateway
- CloudFront distribution
- EventBridge rule (5-minute polling)
- CloudWatch dashboard and alarms

### Deploy Frontend

```bash
# Build frontend
npm run build:frontend

# Update .env.local with API Gateway URL from CDK output

# Deploy to S3/CloudFront
npm run deploy:frontend
```

## 🛠️ Development

### Run Frontend Locally

```bash
npm run dev:frontend
# Opens http://localhost:3000
```

### Test Lambda Functions Locally

Install AWS SAM CLI for local testing:

```bash
# Install dependencies
cd backend/sftp_poller
pip install -r requirements.txt

# Test locally
python handler.py
```

### Update Infrastructure

```bash
cd infrastructure

# See what will change
npm run cdk:diff

# Deploy changes
npm run cdk:deploy
```

## 🔧 Configuration

### SFTP Server Setup

1. Obtain SFTP credentials from Amazon Vendor Central
2. Verify connection:
   ```bash
   sftp -P 22 username@sftp-host.com
   ```
3. Ensure labels are in `/outbound/labels/` directory
4. Update environment variables in Lambda function

### Domain Configuration (Optional)

To use custom domain (e.g., df.themotorbox.com):

1. Create a hosted zone in Route53
2. Update `infrastructure/lib/frontend-stack.ts`:
   ```typescript
   certificate: certificatemanager.Certificate.fromCertificateArn(...)
   domainNames: ['df.themotorbox.com']
   ```
3. Add Route53 alias record pointing to CloudFront

## 📊 Database Schema

### LabelBatches Table

```
Primary Key: batch_id (String)
GSI: ShippingServiceIndex (shipping_service, downloaded_at)

Attributes:
- batch_id: UUID
- batch_file_name: SFTP filename
- shipping_service: UPS | FedEx | USPS
- s3_url: S3 path to PDF
- downloaded_at: ISO timestamp
- total_orders: Number
- batch_printed_at: ISO timestamp (optional)
- batch_confirmed_at: ISO timestamp (optional)
- created_at: ISO timestamp
- updated_at: ISO timestamp
```

### DFOrders Table

```
Primary Key: order_id (String)
Sort Key: batch_id (String)
GSI: BatchIndex (batch_id, print_priority)

Attributes:
- order_id: String
- batch_id: References LabelBatches
- purchase_order_number: String
- order_date: ISO timestamp
- shipping_service: UPS | FedEx | USPS
- print_priority: normal | high | urgent
- ship_confirmed_at: ISO timestamp (optional)
- confirmed_by: String (optional)
- tracking_number: String (optional)
- marked_printed_at: ISO timestamp (optional)
- created_at: ISO timestamp
- updated_at: ISO timestamp
```

## 🔌 API Endpoints

### Batches

- `GET /batches` - List all batches
  - Query params: `shipping_service`, `status`, `date_from`, `date_to`
- `GET /batches/{id}` - Get batch details
- `PATCH /batches/{id}/mark-printed` - Mark batch as printed
- `POST /batches/{id}/ship-confirm` - Confirm all orders in batch
- `GET /batches/{id}/pdf` - Get presigned PDF URL

### Orders

- `GET /batches/{batch_id}/orders` - List orders in batch
- `PATCH /orders/{id}/priority` - Update print priority
- `POST /orders/{id}/ship-confirm` - Confirm single order
- `POST /orders/bulk-ship-confirm` - Confirm multiple orders
- `PATCH /orders/{id}/tracking` - Update tracking number

## 🔍 Monitoring

### CloudWatch Dashboard

Access at: AWS Console → CloudWatch → Dashboards → DFLabelManager

Metrics:
- Lambda invocations
- Lambda errors
- Lambda duration
- API Gateway requests
- DynamoDB operations

### Alarms

- SFTP Poller errors
- API errors
- High Lambda duration

## 🐛 Troubleshooting

### SFTP Connection Issues

```bash
# Test SFTP connection
sftp -vvv -P 22 username@host

# Check Lambda logs
aws logs tail /aws/lambda/df-sftp-poller --follow
```

### API Gateway 502 Errors

- Check Lambda function logs in CloudWatch
- Verify environment variables are set
- Ensure IAM roles have correct permissions

### Frontend Not Loading Data

- Verify API Gateway URL in `.env.local`
- Check CORS configuration in API Gateway
- Open browser console for errors

### DynamoDB Capacity Issues

- Tables use PAY_PER_REQUEST billing mode (auto-scaling)
- Monitor capacity metrics in CloudWatch
- Adjust if needed in `database-stack.ts`

## 🔒 Security

### Best Practices Implemented

- ✅ SFTP credentials stored in environment variables (consider AWS Secrets Manager)
- ✅ S3 buckets with encryption and private access
- ✅ API Gateway with CORS configured
- ✅ Lambda functions with least-privilege IAM roles
- ✅ CloudFront with HTTPS enforced
- ✅ DynamoDB with point-in-time recovery

### Recommendations

1. **Secrets Management**: Migrate SFTP credentials to AWS Secrets Manager
2. **API Authentication**: Add API keys or AWS Cognito
3. **Network**: Deploy Lambda in VPC for enhanced security
4. **Monitoring**: Enable AWS CloudTrail for audit logging

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue in GitHub
- Contact: your-email@example.com

## 🗺️ Roadmap

- [ ] Advanced PDF parsing with OCR
- [ ] Email notifications for new batches
- [ ] Barcode scanning integration
- [ ] Mobile app
- [ ] Multi-tenant support
- [ ] Integration with shipping carrier APIs