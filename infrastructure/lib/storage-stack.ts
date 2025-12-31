import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class StorageStack extends cdk.Stack {
  public readonly labelsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for PDF labels
    this.labelsBucket = new s3.Bucket(this, 'LabelsBucket', {
      bucketName: `df-labels-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'], // Configure based on your domain
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'LabelsBucketName', {
      value: this.labelsBucket.bucketName,
      description: 'S3 Bucket for Label PDFs',
    });

    new cdk.CfnOutput(this, 'LabelsBucketArn', {
      value: this.labelsBucket.bucketArn,
      description: 'S3 Bucket ARN',
    });
  }
}
