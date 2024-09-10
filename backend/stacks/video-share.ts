import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import { resolve } from "path";
import * as lambdaEnvType from "../../lib/lambdaEnv"

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

    //put handler
    const putHandlerEnv: lambdaEnvType.PutHandler = {
      VIDEO_TABLE_NAME: table.tableName,
      VIDEO_TABLE_REGION: this.region,
      UPLOAD_BUCKET_NAME: uploadBucket.bucketName,
      UPLOAD_BUCKET_REGION: this.region,
    }
    const putHandler = new lambda.NodejsFunction(this, "PutHandler", {
      entry: resolve(__dirname, "../../lambdas/putHandler.ts"),
      environment:putHandlerEnv
    });

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

    table.grantWriteData(putHandler);
    uploadBucket.grantPut(putHandler);
  }
}
