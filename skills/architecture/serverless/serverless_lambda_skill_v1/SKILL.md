---
name: serverless_lambda_skill_v1
description: Serverless architecture patterns with AWS Lambda, API Gateway, and event-driven design for scalable, cost-efficient applications
version: 1.0.0
tags: [serverless, aws-lambda, api-gateway, event-driven, cloud, microservices, faas]
stack: aws/serverless-2024
category: architecture
triggers:
  keywords: [serverless, lambda, api gateway, event-driven, cloud functions, faas, sqs, sns, eventbridge]
  filePatterns: [serverless.yml, template.yaml, *.lambda.js, *.lambda.ts]
  commands: [serverless deploy, sam deploy, aws lambda invoke]
  stack: aws/serverless-2024
  projectArchetypes: [api-backend, event-processing, scheduled-tasks, microservices]
  modes: [greenfield, migration, optimization]
prerequisites:
  - aws_fundamentals
  - javascript_or_python
  - api_design_basics
recommended_structure:
  directories:
    - src/
    - src/functions/
    - src/shared/
    - src/lib/
    - tests/
    - tests/unit/
    - tests/e2e/
    - infrastructure/
workflow:
  setup:
    - npm install -g serverless
    - serverless create --template aws-nodejs-typescript
    - npm install
    - serverless deploy
  develop:
    - Write Lambda functions
    - Configure API Gateway
    - Set up event sources
    - Test locally with serverless-offline
  deploy:
    - serverless package
    - serverless deploy --stage production
    - Monitor with CloudWatch
best_practices:
  - Keep functions small and focused (single responsibility)
  - Use environment variables for configuration
  - Implement proper error handling and retry logic
  - Use async/await for I/O operations
  - Minimize cold starts with provisioned concurrency
  - Set appropriate timeout and memory limits
  - Use Lambda layers for shared dependencies
  - Implement distributed tracing (X-Ray)
  - Use dead letter queues for failed invocations
  - Monitor with CloudWatch alarms and dashboards
anti_patterns:
  - Avoid monolithic Lambda functions (do too much)
  - Don't use Lambda for long-running processes (>15 min)
  - Never store state in Lambda (it's stateless)
  - Don't skip IAM least privilege principle
  - Avoid synchronous invocations where possible
  - Don't ignore cold start implications
  - Avoid tight coupling between functions
  - Don't skip local testing before deployment
  - Never hardcode credentials or secrets
  - Don't ignore cost optimization (over-provisioned memory)
scaling_notes: |
  For enterprise-scale serverless applications:

  **Architecture Patterns:**
  - Use event-driven architecture for loose coupling
  - Implement saga pattern for distributed transactions
  - Use API Gateway for request routing and auth
  - Implement circuit breaker for external calls

  **Performance:**
  - Use provisioned concurrency for critical functions
  - Optimize package size (tree shaking, layers)
  - Use connection pooling for database (RDS Proxy)
  - Implement caching (Redis, DAX)

  **Cost Optimization:**
  - Right-size memory allocation
  - Use ARM64 (Graviton2) for better price/performance
  - Implement request batching
  - Use S3 Transfer Acceleration for large payloads

  **Observability:**
  - Enable X-Ray tracing
  - Centralize logs (CloudWatch Logs Insights)
  - Set up custom metrics and alarms
  - Implement structured logging

  **Security:**
  - Use VPC for private resources
  - Implement IAM roles with least privilege
  - Use Secrets Manager for credentials
  - Enable function-level encryption

  **Deployment:**
  - Use CI/CD pipelines
  - Implement canary deployments
  - Use Lambda aliases and versions
  - Set up rollback procedures

when_not_to_use: |
  Serverless/Lambda may not be the best choice for:

  **Long-Running Processes:**
  - Lambda has 15-minute timeout limit
  - Use ECS, EC2, or Batch for longer workloads

  **Consistent High Traffic:**
  - Constant high traffic may be cheaper on containers/EC2
  - Lambda is cost-effective for variable/spiky traffic

  **Low-Latency Requirements:**
  - Cold starts add latency (100ms-5s)
  - Use provisioned concurrency or containers for consistent low latency

  **Large Stateful Applications:**
  - Lambda is stateless by design
  - Use traditional servers for stateful workloads

  **Custom Runtime Requirements:**
  - Limited runtime support
  - Consider containers for custom environments

  **Predictable Steady Workloads:**
  - Reserved instances may be cheaper
  - Calculate break-even point for your use case

output_template: |
  ## Serverless Architecture Decision

  **Platform:** AWS Lambda
  **Runtime:** Node.js 20 / Python 3.11
  **Architecture:** Event-driven with API Gateway
  **Deployment:** Serverless Framework / SAM

  ### Key Decisions
  - **Compute:** Lambda for API and event processing
  - **API:** API Gateway REST API with Lambda proxy
  - **Events:** EventBridge for event routing
  - **Storage:** DynamoDB for NoSQL, S3 for files
  - **Queue:** SQS for async processing

  ### Trade-offs Considered
  - Lambda vs Containers: Lambda for ops simplicity
  - Provisioned vs On-demand: Based on latency requirements
  - Monolith vs Micro-Lambdas: Started monolithic, extract later

  ### Next Steps
  1. Set up Serverless Framework
  2. Create Lambda functions
  3. Configure API Gateway
  4. Set up monitoring and alerts
  5. Implement CI/CD pipeline
dependencies:
  aws_services:
    - AWS Lambda (compute)
    - API Gateway (HTTP/REST API)
    - DynamoDB (NoSQL database)
    - S3 (object storage)
    - SQS (message queue)
    - SNS (pub/sub notifications)
    - EventBridge (event bus)
    - CloudWatch (monitoring)
    - X-Ray (tracing)
    - IAM (access control)
  nodejs_packages:
    - @aws-sdk/client-* (AWS SDK v3)
    - serverless (deployment framework)
    - serverless-offline (local testing)
    - middy (middleware engine)
  python_packages:
    - boto3 (AWS SDK)
    - aws-lambda-powertools (utilities)
    - serverless (deployment framework)
---

<role>
You are a serverless architecture specialist with deep expertise in AWS Lambda, API Gateway, event-driven design, and cloud-native patterns. You provide structured guidance on building scalable, cost-efficient serverless applications following industry best practices.
</role>

<execution_flow>
1. **Requirements Analysis**
   - Identify use cases suitable for serverless
   - Analyze traffic patterns and latency requirements
   - Determine event sources and triggers
   - Assess cost implications

2. **Architecture Design**
   - Design function boundaries
   - Plan event flow and integrations
   - Design data storage strategy
   - Plan security and IAM

3. **Function Development**
   - Implement Lambda functions
   - Add middleware (logging, validation, auth)
   - Implement error handling
   - Write unit tests

4. **Infrastructure Setup**
   - Define infrastructure as code (Serverless/SAM/CDK)
   - Configure API Gateway
   - Set up event sources
   - Configure monitoring

5. **Testing**
   - Local testing with serverless-offline
   - Integration testing in dev environment
   - Load testing for performance
   - Security testing

6. **Deployment & Operations**
   - Set up CI/CD pipeline
   - Deploy to production
   - Configure alerts and dashboards
   - Implement observability
</execution_flow>

<lambda_function_example>
**AWS Lambda Function Example (TypeScript):**

```typescript
// src/functions/create-order/index.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpEventNormalizer from '@middy/http-event-normalizer';

// Initialize Powertools
const logger = new Logger({ serviceName: 'orders' });
const metrics = new Metrics({ namespace: 'orders', serviceName: 'orders' });
const tracer = new Tracer({ serviceName: 'orders' });

// Initialize DynamoDB
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Order schema
interface Order {
  orderId: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

// Lambda handler
const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const segment = tracer.getSegment()?.addNewSubsegment('## createOrder');
  
  try {
    // Extract and validate request body
    const { userId, items } = JSON.parse(event.body || '{}');
    
    logger.info('Creating order', { userId, itemCount: items?.length });
    
    // Validate input
    if (!userId || !items || items.length === 0) {
      throw new Error('Invalid order data');
    }
    
    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate total
    const total = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    
    // Create order object
    const order: Order = {
      orderId,
      userId,
      items,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store in DynamoDB
    const putCommand = new PutCommand({
      TableName: process.env.ORDERS_TABLE!,
      Item: order
    });
    
    await docClient.send(putCommand);
    
    logger.info('Order created successfully', { orderId });
    
    // Record metrics
    metrics.addMetric('OrdersCreated', 1);
    
    // Send response
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Order created successfully',
        order
      })
    };
    
  } catch (error) {
    logger.error('Failed to create order', { error });
    metrics.addMetric('OrderCreationFailed', 1);
    throw error;
  } finally {
    segment?.close();
  }
};

// Export handler with middy middleware
export const handler = middy(lambdaHandler)
  .use(httpEventNormalizer())
  .use(httpJsonBodyParser())
  .use(httpErrorHandler());
```
</lambda_function_example>

<serverless_framework_example>
**Serverless Framework Configuration:**

```yaml
# serverless.yml
service: orders-api

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs20.x
  stage: ${opt:stage, 'dev'}
  region: ${opt:region, 'us-east-1'}
  memorySize: 512
  timeout: 30
  logRetentionInDays: 30
  environment:
    ORDERS_TABLE: ${self:service}-orders-${self:provider.stage}
    USERS_TABLE: ${self:service}-users-${self:provider.stage}
    SNS_TOPIC_ARN: !Ref OrderNotifications
    SQS_QUEUE_URL: !Ref OrderProcessingQueue
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:PutItem
            - dynamodb:GetItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
            - dynamodb:Query
          Resource:
            - !GetAtt OrdersTable.Arn
            - !GetAtt UsersTable.Arn
        - Effect: Allow
          Action:
            - sns:Publish
          Resource:
            - !Ref OrderNotifications
        - Effect: Allow
          Action:
            - sqs:SendMessage
            - sqs:ReceiveMessage
            - sqs:DeleteMessage
          Resource:
            - !GetAtt OrderProcessingQueue.Arn
        - Effect: Allow
          Action:
            - xray:PutTraceSegments
            - xray:PutTelemetryRecords
          Resource: '*'

functions:
  # HTTP API endpoints
  createOrder:
    handler: src/functions/create-order.handler
    description: Create a new order
    events:
      - http:
          path: /orders
          method: post
          cors: true
          authorizer:
            name: authorizer
            arn: !GetAtt AuthorizerFunction.Arn
  
  getOrders:
    handler: src/functions/get-orders.handler
    description: Get all orders for a user
    events:
      - http:
          path: /orders
          method: get
          cors: true
          authorizer:
            name: authorizer
  
  getOrder:
    handler: src/functions/get-order.handler
    description: Get a specific order
    events:
      - http:
          path: /orders/{orderId}
          method: get
          cors: true
          authorizer:
            name: authorizer
  
  updateOrder:
    handler: src/functions/update-order.handler
    description: Update an order
    events:
      - http:
          path: /orders/{orderId}
          method: put
          cors: true
          authorizer:
            name: authorizer
  
  deleteOrder:
    handler: src/functions/delete-order.handler
    description: Delete an order
    events:
      - http:
          path: /orders/{orderId}
          method: delete
          cors: true
          authorizer:
            name: authorizer
  
  # Event-driven functions
  processOrder:
    handler: src/functions/process-order.handler
    description: Process order asynchronously
    timeout: 120
    reservedConcurrency: 10
    events:
      - sqs:
          arn: !GetAtt OrderProcessingQueue.Arn
          batchSize: 10
          maximumBatchingWindow: 5
  
  sendOrderNotification:
    handler: src/functions/send-notification.handler
    description: Send order confirmation notification
    events:
      - sns:
          topicName: OrderNotifications
          filterPolicy:
            eventType:
              - order.created
              - order.shipped
  
  # Scheduled function
  cleanupPendingOrders:
    handler: src/functions/cleanup-pending.handler
    description: Clean up stale pending orders
    events:
      - schedule:
          rate: rate(1 hour)
          enabled: true
          input:
            action: cleanup
            olderThan: 24h

  # Authorizer function
  authorizer:
    handler: src/functions/authorizer.handler
    description: JWT authorizer for API

resources:
  Resources:
    # DynamoDB Tables
    OrdersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:service}-orders-${self:provider.stage}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: orderId
            AttributeType: S
          - AttributeName: userId
            AttributeType: S
          - AttributeName: createdAt
            AttributeType: S
        KeySchema:
          - AttributeName: orderId
            KeyType: HASH
        GlobalSecondaryIndexes:
          - IndexName: UserIdCreatedAtIndex
            KeySchema:
              - AttributeName: userId
                KeyType: HASH
              - AttributeName: createdAt
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES
        TimeToLiveSpecification:
          AttributeName: ttl
          Enabled: true
        PointInTimeRecoverySpecification:
          PointInTimeRecoveryEnabled: true

    UsersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:service}-users-${self:provider.stage}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: userId
            AttributeType: S
        KeySchema:
          - AttributeName: userId
            KeyType: HASH

    # SQS Queue for async processing
    OrderProcessingQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: ${self:service}-order-processing-${self:provider.stage}
        VisibilityTimeout: 120
        MessageRetentionPeriod: 1209600  # 14 days
        RedrivePolicy:
          deadLetterTargetArn: !GetAtt OrderProcessingDLQ.Arn
          maxReceiveCount: 3

    # Dead Letter Queue
    OrderProcessingDLQ:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: ${self:service}-order-processing-dlq-${self:provider.stage}
        MessageRetentionPeriod: 1209600

    # SNS Topic for notifications
    OrderNotifications:
      Type: AWS::SNS::Topic
      Properties:
        TopicName: ${self:service}-order-notifications-${self:provider.stage}

    # CloudWatch Alarms
    OrderCreationErrorAlarm:
      Type: AWS::CloudWatch::Alarm
      Properties:
        AlarmName: ${self:service}-order-creation-errors
        AlarmDescription: Order creation failures exceed threshold
        MetricName: OrderCreationFailed
        Namespace: orders
        Statistic: Sum
        Period: 300
        EvaluationPeriods: 2
        Threshold: 5
        ComparisonOperator: GreaterThanThreshold
        TreatMissingData: notBreaching
        ActionsEnabled: true
        AlarmActions:
          - !Ref OrderAlertsTopic

outputs:
  OrdersTableArn:
    Description: ARN of Orders DynamoDB table
    Value: !GetAtt OrdersTable.Arn
    Export:
      Name: ${self:service}-OrdersTableArn
  
  ApiGatewayUrl:
    Description: URL of the API Gateway
    Value: !Sub 'https://${ServerlessRestApi}.execute-api.${self:provider.region}.amazonaws.com/${self:provider.stage}/'
    Export:
      Name: ${self:service}-ApiGatewayUrl

plugins:
  - serverless-offline
  - serverless-dynamodb-local
  - serverless-prune-plugin

custom:
  prune:
    automatic: true
    number: 3
  
  serverless-offline:
    httpPort: 3000
    lambdaPort: 3002
    noPrependStageInUrl: true
  
  stage: ${opt:stage, 'dev'}
```
</serverless_framework_example>

<event_driven_architecture>
**Event-Driven Architecture with Lambda:**

```typescript
// EventBridge event pattern for order events
// events/order-created.ts
import { EventBridgeEvent } from 'aws-lambda';

interface OrderCreatedDetail {
  orderId: string;
  userId: string;
  total: number;
  timestamp: string;
}

export const handler = async (
  event: EventBridgeEvent<'OrderCreated', OrderCreatedDetail>
) => {
  console.log('Order created event received', event);
  
  // Trigger downstream processes
  await Promise.all([
    sendConfirmationEmail(event.detail),
    updateInventory(event.detail),
    startFraudCheck(event.detail),
    notifyAnalytics(event.detail)
  ]);
};

// Step Functions for order workflow
// src/functions/order-workflow.ts
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

const sfn = new SFNClient({});

export const orderWorkflowDefinition = {
  Comment: 'Order Processing Workflow',
  StartAt: 'ValidateOrder',
  States: {
    ValidateOrder: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:region:account:function:validate-order',
      Next: 'ProcessPayment',
      Catch: [{
        ErrorEquals: ['ValidationError'],
        Next: 'OrderFailed'
      }]
    },
    ProcessPayment: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:region:account:function:process-payment',
      Next: 'UpdateInventory',
      Retry: [{
        ErrorEquals: ['PaymentGatewayTimeout'],
        MaxAttempts: 3,
        IntervalSeconds: 2,
        BackoffRate: 2
      }],
      Catch: [{
        ErrorEquals: ['PaymentFailed'],
        Next: 'OrderFailed'
      }]
    },
    UpdateInventory: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:region:account:function:update-inventory',
      Next: 'SendNotification'
    },
    SendNotification: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:region:account:function:send-confirmation',
      Next: 'OrderComplete'
    },
    OrderComplete: {
      Type: 'Succeed'
    },
    OrderFailed: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:region:account:function:handle-failure',
      Next: 'OrderFailedState'
    },
    OrderFailedState: {
      Type: 'Fail',
      Error: 'OrderProcessingFailed',
      Cause: 'Order processing failed'
    }
  }
};

// Fan-out pattern with SNS
// Publish to SNS topic
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({});

await sns.send(new PublishCommand({
  TopicArn: process.env.SNS_TOPIC_ARN,
  Message: JSON.stringify({
    orderId: 'ORD-123',
    eventType: 'order.created',
    timestamp: new Date().toISOString()
  }),
  MessageAttributes: {
    eventType: {
      DataType: 'String',
      StringValue: 'order.created'
    }
  }
}));

// Multiple Lambda functions subscribe to the same topic
// Each function processes the event independently
```
</event_driven_architecture>

<performance_optimization>
**Lambda Performance Optimization:**

```typescript
// 1. Connection Reuse (outside handler)
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// ✅ GOOD: Client outside handler (reused across invocations)
const client = new DynamoDBClient({});

export const handler = async (event) => {
  // Use existing client
  return await client.send(command);
};

// 2. Initialize resources outside handler
const heavyComputation = precompute();  // Run once during init

export const handler = async (event) => {
  // Use precomputed value
  return { result: heavyComputation };
};

// 3. Use Lambda Layers for dependencies
// serverless.yml
functions:
  myFunction:
    handler: src/functions/my-function.handler
    layers:
      - arn:aws:lambda:region:account-id:layer:layer-name:version

// 4. Provisioned Concurrency for critical functions
functions:
  criticalApi:
    handler: src/functions/critical.handler
    provisionedConcurrency: 10

// 5. Power Tuning (adjust memory for cost/performance)
// Use AWS Lambda Power Tuning tool
// https://github.com/alexcasalboni/aws-lambda-power-tuning

// 6. Use ARM64 (Graviton2) for better price/performance
provider:
  architectureType: arm64

// 7. Minimize package size
// webpack.config.js
module.exports = {
  target: 'node',
  mode: 'production',
  optimization: {
    minimize: true,
    treeShaking: true
  }
};

// 8. Async operations with proper error handling
export const handler = async (event) => {
  // ✅ GOOD: Parallel async operations
  const [user, products, inventory] = await Promise.all([
    getUser(event.userId),
    getProducts(event.productIds),
    getInventory(event.productIds)
  ]);
  
  return { user, products, inventory };
};

// 9. Streaming responses for large payloads
import { Readable } from 'stream';

export const handler = async () => {
  const stream = new Readable({
    read() {
      this.push(largeDataChunk);
      this.push(null);  // End stream
    }
  });
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/octet-stream' },
    body: stream,
    isBase64Encoded: true
  };
};

// 10. Batch processing with SQS
export const handler = async (event) => {
  // Process batch efficiently
  const results = await Promise.all(
    event.Records.map(async (record) => {
      return await processMessage(JSON.parse(record.body));
    })
  );
  
  return { processed: results.length };
};
```
</performance_optimization>

<monitoring_setup>
**Lambda Monitoring Setup:**

```yaml
# CloudWatch Alarms (serverless.yml)
resources:
  Resources:
    # Error rate alarm
    FunctionErrorsAlarm:
      Type: AWS::CloudWatch::Alarm
      Properties:
        AlarmName: ${self:service}-function-errors
        AlarmDescription: Lambda function error rate exceeds threshold
        MetricName: Errors
        Namespace: AWS/Lambda
        Statistic: Sum
        Period: 60
        EvaluationPeriods: 2
        Threshold: 10
        ComparisonOperator: GreaterThanThreshold
        Dimensions:
          - Name: FunctionName
            Value: !Ref CreateOrderLambdaFunction
    
    # Duration alarm
    FunctionDurationAlarm:
      Type: AWS::CloudWatch::Alarm
      Properties:
        AlarmName: ${self:service}-function-duration
        AlarmDescription: Lambda function duration exceeds threshold
        MetricName: Duration
        Namespace: AWS/Lambda
        Statistic: Average
        Period: 300
        EvaluationPeriods: 2
        Threshold: 5000  # 5 seconds
        ComparisonOperator: GreaterThanThreshold
    
    # Throttles alarm
    FunctionThrottlesAlarm:
      Type: AWS::CloudWatch::Alarm
      Properties:
        AlarmName: ${self:service}-function-throttles
        AlarmDescription: Lambda function throttling detected
        MetricName: Throttles
        Namespace: AWS/Lambda
        Statistic: Sum
        Period: 60
        EvaluationPeriods: 1
        Threshold: 1
        ComparisonOperator: GreaterThanOrEqualToThreshold
    
    # Concurrent executions alarm
    ConcurrentExecutionsAlarm:
      Type: AWS::CloudWatch::Alarm
      Properties:
        AlarmName: ${self:service}-concurrent-executions
        AlarmDescription: High concurrent execution count
        MetricName: ConcurrentExecutions
        Namespace: AWS/Lambda
        Statistic: Maximum
        Period: 60
        EvaluationPeriods: 2
        Threshold: 800  # 80% of default account limit
        ComparisonOperator: GreaterThanThreshold

# CloudWatch Dashboard
    ServerlessDashboard:
      Type: AWS::CloudWatch::Dashboard
      Properties:
        DashboardName: ${self:service}-dashboard
        DashboardBody: |
          {
            "widgets": [
              {
                "type": "metric",
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 6,
                "properties": {
                  "metrics": [
                    ["AWS/Lambda", "Invocations", "FunctionName", "${self:service}-createOrder"]
                  ],
                  "period": 300,
                  "stat": "Sum",
                  "title": "Invocations"
                }
              },
              {
                "type": "metric",
                "x": 12,
                "y": 0,
                "width": 12,
                "height": 6,
                "properties": {
                  "metrics": [
                    ["AWS/Lambda", "Errors", "FunctionName", "${self:service}-createOrder"],
                    [".", "Duration", ".", ".", { "stat": "Average" }]
                  ],
                  "period": 300,
                  "title": "Errors & Duration"
                }
              }
            ]
          }
```
</monitoring_setup>
