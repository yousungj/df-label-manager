import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

interface LambdaStackProps extends cdk.StackProps {
  batchesTable: dynamodb.Table;
  ordersTable: dynamodb.Table;
  labelsBucket: s3.Bucket;
}

export class LambdaStack extends cdk.Stack {
  public readonly sftpPollerFunction: lambda.Function;
  public readonly batchesApiFunction: lambda.Function;
  public readonly ordersApiFunction: lambda.Function;
  public readonly shipConfirmFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // Lambda Layer for shared dependencies
    const commonLayer = new lambda.LayerVersion(this, 'CommonLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/shared')),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_11],
      description: 'Common utilities for DF Label Manager',
    });

    // Environment variables
    const commonEnv = {
      DYNAMODB_TABLE_BATCHES: props.batchesTable.tableName,
      DYNAMODB_TABLE_ORDERS: props.ordersTable.tableName,
      S3_BUCKET: props.labelsBucket.bucketName,
    };

    // SFTP Poller Lambda
    this.sftpPollerFunction = new lambda.Function(this, 'SftpPollerFunction', {
      functionName: 'df-sftp-poller',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/sftp_poller')),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      layers: [commonLayer],
      environment: {
        ...commonEnv,
        SFTP_HOST: process.env.SFTP_HOST || '',
        SFTP_PORT: process.env.SFTP_PORT || '22',
        SFTP_USER: process.env.SFTP_USER || '',
        SFTP_PASSWORD: process.env.SFTP_PASSWORD || '',
      },
    });

    // Grant permissions
    props.batchesTable.grantReadWriteData(this.sftpPollerFunction);
    props.ordersTable.grantReadWriteData(this.sftpPollerFunction);
    props.labelsBucket.grantReadWrite(this.sftpPollerFunction);

    // EventBridge rule to trigger SFTP poller every 5 minutes
    const pollerRule = new events.Rule(this, 'SftpPollerSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      description: 'Trigger SFTP poller every 5 minutes',
    });
    pollerRule.addTarget(new targets.LambdaFunction(this.sftpPollerFunction));

    // Batches API Lambda
    this.batchesApiFunction = new lambda.Function(this, 'BatchesApiFunction', {
      functionName: 'df-batches-api',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'batches.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/api')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      layers: [commonLayer],
      environment: commonEnv,
    });

    props.batchesTable.grantReadWriteData(this.batchesApiFunction);
    props.ordersTable.grantReadWriteData(this.batchesApiFunction);
    props.labelsBucket.grantRead(this.batchesApiFunction);

    // Orders API Lambda
    this.ordersApiFunction = new lambda.Function(this, 'OrdersApiFunction', {
      functionName: 'df-orders-api',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'orders.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/api')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      layers: [commonLayer],
      environment: commonEnv,
    });

    props.ordersTable.grantReadWriteData(this.ordersApiFunction);

    // Ship Confirm Lambda
    this.shipConfirmFunction = new lambda.Function(this, 'ShipConfirmFunction', {
      functionName: 'df-ship-confirm',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'ship_confirm.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/api')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      layers: [commonLayer],
      environment: commonEnv,
    });

    props.ordersTable.grantReadWriteData(this.shipConfirmFunction);

    // Outputs
    new cdk.CfnOutput(this, 'SftpPollerFunctionArn', {
      value: this.sftpPollerFunction.functionArn,
    });

    new cdk.CfnOutput(this, 'BatchesApiFunctionArn', {
      value: this.batchesApiFunction.functionArn,
    });

    new cdk.CfnOutput(this, 'OrdersApiFunctionArn', {
      value: this.ordersApiFunction.functionArn,
    });
  }
}
