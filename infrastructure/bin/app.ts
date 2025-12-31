#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { StorageStack } from '../lib/storage-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { ApiStack } from '../lib/api-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Database Stack
const databaseStack = new DatabaseStack(app, 'DFLabelManager-Database', {
  env,
  description: 'DynamoDB tables for DF Label Manager',
});

// Storage Stack
const storageStack = new StorageStack(app, 'DFLabelManager-Storage', {
  env,
  description: 'S3 buckets for DF Label Manager',
});

// Lambda Stack
const lambdaStack = new LambdaStack(app, 'DFLabelManager-Lambda', {
  env,
  description: 'Lambda functions for DF Label Manager',
  batchesTable: databaseStack.batchesTable,
  ordersTable: databaseStack.ordersTable,
  labelsBucket: storageStack.labelsBucket,
});
lambdaStack.addDependency(databaseStack);
lambdaStack.addDependency(storageStack);

// API Stack
const apiStack = new ApiStack(app, 'DFLabelManager-API', {
  env,
  description: 'API Gateway for DF Label Manager',
  batchesApiFunction: lambdaStack.batchesApiFunction,
  ordersApiFunction: lambdaStack.ordersApiFunction,
});
apiStack.addDependency(lambdaStack);

// Frontend Stack
const frontendStack = new FrontendStack(app, 'DFLabelManager-Frontend', {
  env,
  description: 'Frontend hosting for DF Label Manager',
});

// Monitoring Stack
const monitoringStack = new MonitoringStack(app, 'DFLabelManager-Monitoring', {
  env,
  description: 'Monitoring and alarms for DF Label Manager',
  sftpPollerFunction: lambdaStack.sftpPollerFunction,
  batchesApiFunction: lambdaStack.batchesApiFunction,
  ordersApiFunction: lambdaStack.ordersApiFunction,
});
monitoringStack.addDependency(lambdaStack);

app.synth();
