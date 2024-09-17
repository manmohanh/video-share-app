import { EventBridgeHandler } from "aws-lambda";
import { VideoDB } from "../entity/Video";
import { S3 } from "../lib/s3";
import { MediaConvertEventHandler as Env } from "./../lib/lambdaEnv"

const env = process.env as Env

const sampleEvent = {
  version: "0",
  id: "3fbdfd76-ff41-9ff8-d1ac-c3eecd53031b",
  "detail-type": "MediaConvert Job State Change",
  source: "aws.mediaconvert",
  account: "123456789012",
  time: "2017-11-29T18:57:11Z",
  region: "us-east-1",
  resources: [
    "arn:aws:mediaconvert:us-east-1:123456789012:jobs/123456789012-smb6o7",
  ],
  detail: {
    timestamp: 1511981831811,
    accountId: "123456789012",
    queue: "arn:aws:mediaconvert:us-east-1:123456789012:queues/Default",
    jobId: "123456789012-smb6o7",
    status: "PROGRESSING",
    userMetadata: {
      id: "video-123",
    },
  },
};

const videoDb = new VideoDB({
  region: env.VIDEO_TABLE_REGION || "ap-south-1",
  tableName: env.VIDEO_TABLE_NAME || "test-table"
})

const uploadBucket = new S3({
  region: env.UPLOAD_BUCKET_REGION || "ap-south-1",
  bucketName: env.UPLOAD_BUCKET_NAME || "test-bucket"
})

export const handler: EventBridgeHandler<"",
  {
    status: "PROGRESSING" | "COMPLETE" | "ERROR",
    userMetadata: {
      id: string
    }
  }, any> = async (e) => {

    try {

      const id = e.detail.userMetadata.id
      if (!id) throw new Error('No video id provided in the video metadata')
      const status = e.detail.status

      switch (status) {
        case "COMPLETE":
          await videoDb.update({
            id,
            attrs: {
              status: "READY"
            }
          })
          await uploadBucket.deleteObject(id)
          break;
        case "PROGRESSING":
          await videoDb.update({
            id,
            attrs: {
              status: "PROCESSING"
            }
          })
          break;
        case "ERROR":
          await videoDb.update({
            id,
            attrs: {
              status: "ERROR"
            }
          })
          await uploadBucket.deleteObject(id)
          break;

        default:
          break;
      }
    } catch (error) {
      console.log(error)
    }
  }
