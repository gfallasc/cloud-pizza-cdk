import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as apigwv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { CfnIntegration, CfnRoute } from 'aws-cdk-lib/aws-apigatewayv2';

/**
 * Helper function to create a cdk lambda
 */
function createLambda(stack: Stack, id: string, handler: string) {
  return new lambda.Function(stack, id, {
    handler,
    runtime: lambda.Runtime.NODEJS_18_X,
    code: lambda.Code.fromAsset('dist/lambda'),
  });
}

export class CloudPizzaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * Necessary Lambda functions for the Step Functions
     * 
     * 1. Validate pizza
     * 2. Deliver pizza
     * 3. Notify support 
     */
    const pineappleCheckLambda = createLambda(this, 'pineappleCheckLambdaHandler', 'orderPizza.handler');
    const deliverPizzaLambda = createLambda(this, 'deliverPizzaHandler', 'deliverPizza.handler');
    const notifySupportLambda = createLambda(this, 'notifySupportHandler', 'notifySupport.handler');

    /**
     * #1 Order
     */

    // Lambda Task to analyze pizza flavour
    const orderPizza = new tasks.LambdaInvoke(this, "Order Pizza Job", {
      lambdaFunction: pineappleCheckLambda,
      inputPath: '$.flavour',
      resultPath: '$.pineappleAnalysis',
      payloadResponseOnly: true
    });

    /**
     * #2 Check order analysis and cook
     */

    // Pizza Order failure step defined
    const pineappleDetected = new sfn.Fail(this, 'Sorry, We Dont add Pineapple', {
      cause: 'They asked for Pineapple',
      error: 'Failed To Make Pizza',
    });

    // Cook pizza state simulation 1 seconds, this could be another LambdaInvoke state
    const cookPizza = new sfn.Wait(this, 'Lets make your pizza', {
      time: sfn.WaitTime.duration(Duration.seconds(1))
    });

    // Choice state condition to check for pinneapple flavour and then cook
    const checkPizza = new sfn.Choice(this, 'With Pineapple?') // Logical choice added to flow
      // Look at the "containsPineapple" field   
      .when(sfn.Condition.booleanEquals('$.pineappleAnalysis.containsPineapple', true), pineappleDetected) // Fail for pineapple
      // Cook pizza
      .otherwise(cookPizza);

    /**
    * #3 Deliver pizza
    */

    // Deliver failed state to finish the flow
    const deliveryFailed = new sfn.Fail(this, 'Delivery failed', {
      cause: 'They asked for Pineapple',
      error: 'Failed to deliver pizza',
    });

    // Lambda Task to notify support pizza lambda task
    const notifySupport = new tasks.LambdaInvoke(this, 'Notify support Job', {
      lambdaFunction: notifySupportLambda
    }).addRetry({ maxAttempts: 3 }) // Retry 3 times max to notify support

    // Deliver pizza lambda task
    const deliverPizza = new tasks.LambdaInvoke(this, "Deliver Pizza Job", {
      lambdaFunction: deliverPizzaLambda,
      resultPath: '$.deliveryResult',
      payloadResponseOnly: true,
    }).addCatch(notifySupport.next(deliveryFailed)) // Catch errors and then notify support and end state
    
    /**
     * #4 Deliver succeded
     */

    // Deliver succeed state to finish the flow
    const deliverSucceeded = new sfn.Succeed(this, 'Deliver succeeded', {
      inputPath: '$',
      outputPath: '$'
    });


    //Express Step function definition
    const definition = sfn.Chain
      .start(orderPizza)      // Step 1: Order starts
      .next(checkPizza.afterwards())       // Step 2: Check flavour analysis and cook
      .next(deliverPizza)     // Step 3: Deliver pizza
      .next(deliverSucceeded) // Step 4: Deliver succeeded

    // State machine
    const stateMachine = new sfn.StateMachine(this, 'PizzaStateMachine', {
      definition,
      timeout: Duration.minutes(5),
      tracingEnabled: true,
      stateMachineType: sfn.StateMachineType.EXPRESS
    });

    /**
   * HTTP API Definition
   */

    // We need to give our HTTP API permission to invoke our step function
    const httpApiRole = new Role(this, 'HttpApiRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      inlinePolicies: {
        AllowSFNExec: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['states:StartSyncExecution'],
              effect: Effect.ALLOW,
              resources: [stateMachine.stateMachineArn]
            })
          ]
        })
      }
    })

    // defines an API Gateway HTTP API resource backed by our step function
    const api = new apigwv2.HttpApi(this, 'cloud-pizza-api', {
      createDefaultStage: true,
    });

    // create an AWS_PROXY integration between the HTTP API and our Step Function
    const integ = new CfnIntegration(this, 'Integ', {
      apiId: api.httpApiId,
      integrationType: 'AWS_PROXY',
      connectionType: 'INTERNET',
      integrationSubtype: 'StepFunctions-StartSyncExecution',
      credentialsArn: httpApiRole.roleArn,
      requestParameters: {
        Input: "$request.body",
        StateMachineArn: stateMachine.stateMachineArn
      },
      payloadFormatVersion: '1.0',
      timeoutInMillis: 10000,
    });

    new CfnRoute(this, 'DefaultRoute', {
      apiId: api.httpApiId,
      routeKey: apigwv2.HttpRouteKey.DEFAULT.key,
      target: `integrations/${integ.ref}`,
    });

    // output the URL of the HTTP API
    new CfnOutput(this, 'HTTP API Url', {
      value: api.url ?? 'Something went wrong with the deploy'
    });
  }
}
