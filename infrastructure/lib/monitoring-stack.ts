import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  sftpPollerFunction: lambda.Function;
  batchesApiFunction: lambda.Function;
  ordersApiFunction: lambda.Function;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS Topic for alarms (optional)
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: 'DF Label Manager Alarms',
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: 'DFLabelManager',
    });

    // Lambda Error Alarms
    const createErrorAlarm = (fn: lambda.Function, name: string) => {
      const alarm = new cloudwatch.Alarm(this, `${name}ErrorAlarm`, {
        metric: fn.metricErrors({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: `Errors in ${name} Lambda function`,
        alarmName: `${name}-errors`,
      });

      // Optional: Add SNS action
      // alarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

      return alarm;
    };

    createErrorAlarm(props.sftpPollerFunction, 'SftpPoller');
    createErrorAlarm(props.batchesApiFunction, 'BatchesApi');
    createErrorAlarm(props.ordersApiFunction, 'OrdersApi');

    // Dashboard widgets
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          props.sftpPollerFunction.metricInvocations(),
          props.batchesApiFunction.metricInvocations(),
          props.ordersApiFunction.metricInvocations(),
        ],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          props.sftpPollerFunction.metricErrors(),
          props.batchesApiFunction.metricErrors(),
          props.ordersApiFunction.metricErrors(),
        ],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [
          props.sftpPollerFunction.metricDuration(),
          props.batchesApiFunction.metricDuration(),
          props.ordersApiFunction.metricDuration(),
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
