import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  batchesApiFunction: lambda.Function;
  ordersApiFunction: lambda.Function;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // API Gateway REST API
    this.api = new apigateway.RestApi(this, 'DfLabelApi', {
      restApiName: 'DF Label Manager API',
      description: 'API for DF Label Manager',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
    });

    // Lambda integrations
    const batchesIntegration = new apigateway.LambdaIntegration(props.batchesApiFunction);
    const ordersIntegration = new apigateway.LambdaIntegration(props.ordersApiFunction);

    // /batches endpoint
    const batches = this.api.root.addResource('batches');
    batches.addMethod('GET', batchesIntegration);

    // /batches/{id}
    const batchById = batches.addResource('{id}');
    batchById.addMethod('GET', batchesIntegration);

    // /batches/{id}/mark-printed
    const markPrinted = batchById.addResource('mark-printed');
    markPrinted.addMethod('PATCH', batchesIntegration);

    // /batches/{id}/ship-confirm
    const shipConfirm = batchById.addResource('ship-confirm');
    shipConfirm.addMethod('POST', batchesIntegration);

    // /batches/{id}/pdf
    const pdf = batchById.addResource('pdf');
    pdf.addMethod('GET', batchesIntegration);

    // /batches/{batch_id}/orders
    const orders = batchById.addResource('orders');
    orders.addMethod('GET', ordersIntegration);

    // /orders
    const ordersRoot = this.api.root.addResource('orders');

    // /orders/{id}
    const orderById = ordersRoot.addResource('{id}');

    // /orders/{id}/priority
    const priority = orderById.addResource('priority');
    priority.addMethod('PATCH', ordersIntegration);

    // /orders/{id}/ship-confirm
    const orderShipConfirm = orderById.addResource('ship-confirm');
    orderShipConfirm.addMethod('POST', ordersIntegration);

    // /orders/{id}/tracking
    const tracking = orderById.addResource('tracking');
    tracking.addMethod('PATCH', ordersIntegration);

    // /orders/bulk-ship-confirm
    const bulkShipConfirm = ordersRoot.addResource('bulk-ship-confirm');
    bulkShipConfirm.addMethod('POST', ordersIntegration);

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API Gateway ID',
    });
  }
}
