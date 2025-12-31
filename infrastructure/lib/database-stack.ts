import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
  public readonly batchesTable: dynamodb.Table;
  public readonly ordersTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // LabelBatches Table
    this.batchesTable = new dynamodb.Table(this, 'LabelBatchesTable', {
      tableName: 'LabelBatches',
      partitionKey: {
        name: 'batch_id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI for shipping service queries
    this.batchesTable.addGlobalSecondaryIndex({
      indexName: 'ShippingServiceIndex',
      partitionKey: {
        name: 'shipping_service',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'downloaded_at',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // DFOrders Table
    this.ordersTable = new dynamodb.Table(this, 'DFOrdersTable', {
      tableName: 'DFOrders',
      partitionKey: {
        name: 'order_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'batch_id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI for batch queries
    this.ordersTable.addGlobalSecondaryIndex({
      indexName: 'BatchIndex',
      partitionKey: {
        name: 'batch_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'print_priority',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'BatchesTableName', {
      value: this.batchesTable.tableName,
      description: 'LabelBatches Table Name',
    });

    new cdk.CfnOutput(this, 'OrdersTableName', {
      value: this.ordersTable.tableName,
      description: 'DFOrders Table Name',
    });
  }
}
