import { S3Handler } from "aws-lambda";
import { VideoDB } from "../entity/Video";
import { S3EventListener as Env } from "../lib/lambdaEnv";
import { VideoMetadata } from "../lib/video-metadata";
import { S3 } from "../lib/s3";
import { VideoConverter } from "../lib/video-convert";

const env = process.env as Env;


const videoMetadata = new VideoMetadata({
  mediaInfoCliPath: env.MEDIA_INFO_CLI,
});
//s3
const uploadBucket = new S3({
  bucketName: env.UPLOAD_BUCKET_NAME || "test-bucket",
  region: env.UPLOAD_BUCKET_REGION || "ap-south-1",
});

export const handler: S3Handler = async (e) => {
  const id = e.Records[0].s3.object.key;

  const videoDb = new VideoDB({
    region: env.VIDEO_TABLE_REGION,
    tableName: env.VIDEO_TABLE_NAME,
  });


  //update video status
  videoDb.collectChanges({
    status: "UPLOADED",
  });

  const videoConverter = new VideoConverter({
    roleArn: env.MEDIA_CONVERT_ROLE_ARN,
    region: env.MEDIA_CONVERT_REGION,
    endpoint: env.MEDIA_CONVERT_ENDPOINT,
    inputFile: `s3://${env.UPLOAD_BUCKET_NAME}/${id}`,
    outputFile: `s3://${env.MEDIA_CONVERT_OUTPUT_BUCKET}/${id}`,
    userMetadata: {
      id,
    }
  });

  //metadata
  const metadata = await videoMetadata.fromUrl(
    await uploadBucket.getDownloadUrl({
      key: id,
      expiresIn: 2 * 60,
    })
  );

  if (metadata.width >= 1280) {
    videoConverter.addResolution({
      width: 1280,
      height: 720,
      bitRate: 500000,
      nameExtension: "_720p",
    });
    videoDb.addFiles({
      "720p": `https://${env.MEDIA_CONVERT_OUTPUT_BUCKET}.s3.amazonaws.com/${id}_720p.mp4`,
    });
  }

  if (metadata.width >= 640) {
    videoConverter.addResolution({
      width: 640,
      height: 360,
      bitRate: 100000,
      nameExtension: "_360p",
    });
    videoDb.addFiles({
      "360p": `https://${env.MEDIA_CONVERT_OUTPUT_BUCKET}.s3.amazonaws.com/${id}_360p.mp4`,
    });
  } else {
    videoConverter.addResolution({
      width: metadata.width,
      height: metadata.height,
      bitRate: 100000,
      nameExtension: "_240p",
    });
    videoDb.addFiles({
      "240p": `https://${env.MEDIA_CONVERT_OUTPUT_BUCKET}.s3.amazonaws.com/${id}_240p.mp4`,
    });
  }

  await videoDb.update({
    id,
    attrs: videoDb.changes,
  });

  await videoConverter.convert();
};
