import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3Notification from "aws-cdk-lib/aws-s3-notifications";
import { resolve } from "path";
import * as lambdaEnvType from "../../lib/lambdaEnv";
import * as event from "aws-cdk-lib/aws-events"
import * as eventTarget from "aws-cdk-lib/aws-events-targets"

export class VideoShareAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //dynamodb
    const table = new dynamodb.Table(this, "VideoTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    table.addGlobalSecondaryIndex({
      indexName: "byUser",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "uploadedTime", type: dynamodb.AttributeType.NUMBER },
    });

    //upload video bucket
    const uploadBucket = new s3.Bucket(this, "UploadBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const streamBucket = new s3.Bucket(this, "StreamBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    streamBucket.grantPublicAccess()

    //MediaConvertRole
    const mediaConvertRole = new iam.Role(this, "MediaConvertRole", {
      assumedBy: new iam.ServicePrincipal("mediaconvert.amazonaws.com"),
    });

    //mediaController env
    const mediaConvertEventHandlerEnv: lambdaEnvType.MediaConvertEventHandler = {
      VIDEO_TABLE_NAME: table.tableName,
      VIDEO_TABLE_REGION: this.region,
      UPLOAD_BUCKET_NAME: uploadBucket.bucketName,
      UPLOAD_BUCKET_REGION: this.region
    }
    //mediaConvertEventHandler
    const mediaConvertEventHandler = new lambda.NodejsFunction(this, "MediaConvertEventHandler", {
      entry: resolve(__dirname, "../../lambdas/mediaConvertEventHandler.ts"),
      environment: mediaConvertEventHandlerEnv
    })

    //put handler
    const putHandlerEnv: lambdaEnvType.PutHandler = {
      VIDEO_TABLE_NAME: table.tableName,
      VIDEO_TABLE_REGION: this.region,
      UPLOAD_BUCKET_NAME: uploadBucket.bucketName,
      UPLOAD_BUCKET_REGION: this.region,
    };

    //s3 event listener handler
    const s3EventListenerEnv: lambdaEnvType.S3EventListener = {
      VIDEO_TABLE_NAME: table.tableName,
      VIDEO_TABLE_REGION: this.region,
      MEDIA_INFO_CLI: "./mediainfo",
      UPLOAD_BUCKET_NAME: uploadBucket.bucketName,
      UPLOAD_BUCKET_REGION: this.region,
      MEDIA_CONVERT_ROLE_ARN: mediaConvertRole.roleArn,
      MEDIA_CONVERT_REGION: this.region,
      MEDIA_CONVERT_ENDPOINT:
        "https://htunurlzb.mediaconvert.ap-south-1.amazonaws.com",
      MEDIA_CONVERT_OUTPUT_BUCKET: streamBucket.bucketName,
    };

    const s3EventListener = new lambda.NodejsFunction(this, "S3EventListener", {
      entry: resolve(__dirname, "../../lambdas/s3EvenListener.ts"),
      environment: s3EventListenerEnv,
      timeout: cdk.Duration.seconds(15),
      bundling: {
        commandHooks: {
          afterBundling(inputDir, outputDir) {
            return [`cp '${inputDir}/lambda-binary/mediainfo' '${outputDir}'`];
          },
          beforeBundling(inputDir, outputDir) {
            return [];
          },
          beforeInstall(inputDir, outputDir) {
            return [];
          },
        },
      },
    });

    const putHandler = new lambda.NodejsFunction(this, "PutHandler", {
      entry: resolve(__dirname, "../../lambdas/putHandler.ts"),
      environment: putHandlerEnv,
    });

    //MediaConvertJobStateChangeRule
    new event.Rule(this, "MediaConvertJobStateChangeRule", {
      eventPattern: {
        "source": ["aws.mediaconvert"],
        "detailType": ["MediaConvert Job State Change"],
        "detail": {
          "status": ["ERROR", "COMPLETE", "PROGRESSING"]
        }
      },
      targets: [new eventTarget.LambdaFunction(mediaConvertEventHandler)]
    })

    //Api Gateway
    const rootApi = new apigateway.RestApi(this, "VideoShareRootApi", {
      deploy: false,
    });
    rootApi.root
      .addResource("video")
      .addMethod("PUT", new apigateway.LambdaIntegration(putHandler));
    rootApi.deploymentStage = new apigateway.Stage(
      this,
      "VideoShareRootApiDevStage",
      {
        stageName: "dev",
        deployment: new apigateway.Deployment(
          this,
          "VideoShareRootApiDeployment",
          {
            api: rootApi,
          }
        ),
      }
    );

    //s3 event notification
    uploadBucket.addObjectCreatedNotification(
      new s3Notification.LambdaDestination(s3EventListener)
    );

    table.grantWriteData(putHandler);
    table.grantWriteData(s3EventListener);
    table.grantWriteData(mediaConvertEventHandler)
    uploadBucket.grantPut(putHandler);
    uploadBucket.grantRead(s3EventListener);
    uploadBucket.grantRead(mediaConvertRole);
    uploadBucket.grantDelete(mediaConvertEventHandler)
    streamBucket.grantWrite(mediaConvertRole);

    s3EventListener.role?.attachInlinePolicy(
      new iam.Policy(this, "S3EventListenerPolicy#passRole", {
        statements: [
          new iam.PolicyStatement({
            actions: ["iam:PassRole", "mediaconvert:CreateJob"],
            resources: ["*"],
          }),
        ],
      })
    );
  }
}
