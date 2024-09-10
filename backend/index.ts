#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { VideoShareAppStack } from "./stacks/video-share";

const app = new cdk.App();
new VideoShareAppStack(app, "VideoShareAppStack", {

  env: { region: 'ap-south-1' }
});
