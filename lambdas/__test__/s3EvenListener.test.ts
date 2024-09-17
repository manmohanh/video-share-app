/**
 * TODO:
 * - update the database with correct metadata
 * - process the video file
 * - Get the video metadata
 * - Based on metadata convert the video into mutliple resolution
 */

const prevEnv = process.env;
process.env = {
  ...prevEnv,
  MEDIA_CONVERT_OUTPUT_BUCKET: "output-bucket",
};

import { VideoDB } from "../../entity/Video";
import { VideoMetadata } from "../../lib/video-metadata";
import { handler } from "../s3EvenListener";
import { VideoConverter } from "../../lib/video-convert";

function getEvent(bucketName: string, key: string) {
  return {
    Records: [
      {
        eventVersion: "2.2",
        eventSource: "aws:s3",
        awsRegion: "us-west-2",
        eventTime:
          "The time, in ISO-8601 format, for example, 1970-01-01T00:00:00.000Z, when Amazon S3 finished processing the request",
        eventName: "event-type",
        userIdentity: {
          principalId: "Amazon-customer-ID-of-the-user-who-caused-the-event",
        },
        requestParameters: {
          sourceIPAddress: "ip-address-where-request-came-from",
        },
        responseElements: {
          "x-amz-request-id": "Amazon S3 generated request ID",
          "x-amz-id-2": "Amazon S3 host that processed the request",
        },
        s3: {
          s3SchemaVersion: "1.0",
          configurationId: "ID found in the bucket notification configuration",
          bucket: {
            name: bucketName,
            ownerIdentity: {
              principalId: "Amazon-customer-ID-of-the-bucket-owner",
            },
            arn: "bucket-ARN",
          },
          object: {
            key: key,
            size: "object-size in bytes",
            eTag: "object eTag",
            versionId:
              "object version if bucket is versioning-enabled, otherwise null",
            sequencer:
              "a string representation of a hexadecimal value used to determine event sequence, only used with PUTs and DELETEs",
          },
        },
        glacierEventData: {
          restoreEventData: {
            lifecycleRestorationExpiryTime:
              "The time, in ISO-8601 format, for example, 1970-01-01T00:00:00.000Z, of Restore Expiry",
            lifecycleRestoreStorageClass: "Source storage class for restore",
          },
        },
      },
    ],
  };
}

function callHandler() {
  return (handler as any)(getEvent("test-bucket", "id-123"));
}

describe("Test for S3EventListener", () => {
  const mockUpdate = jest.spyOn(VideoDB.prototype, "update");
  const mockedGetMetadata = jest.spyOn(VideoMetadata.prototype, "fromUrl");
  const mockedAddResolution = jest.spyOn(
    VideoConverter.prototype,
    "addResolution"
  );

  beforeEach(async () => {
    mockUpdate.mockImplementation(async () => undefined as any);
    mockedGetMetadata.mockResolvedValue({
      fileSize: 54321,
      width: 1280,
      height: 720,
      duration: 90,
    });

    jest
      .spyOn(VideoConverter.prototype, "convert")
      .mockImplementation(async () => undefined as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    process.env = prevEnv;
  });
  test("should update the correct metadata", async () => {
    await callHandler();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate.mock.calls[0][0].id).toBe("id-123");
    expect(mockUpdate.mock.calls[0][0].attrs.status).toBe("UPLOADED");
  });

  test("should get the url properly and send it to the getMetadata function", async () => {
    await callHandler();
    expect(mockedGetMetadata).toHaveBeenCalledTimes(1);
    const input = mockedGetMetadata.mock.calls[0][0];
    expect(input).toContain("http");
    expect(input).toContain("id-123");
  });

  test("should get two res if width is greater than or equal to 1280", async () => {
    await callHandler();
    expect(mockedAddResolution).toHaveBeenCalledTimes(2);
    expect(mockedAddResolution.mock.calls[0][0].width).toBe(1280);
    expect(mockedAddResolution.mock.calls[0][0].height).toBe(720);
    expect(mockedAddResolution.mock.calls[1][0].width).toBe(640);
    expect(mockedAddResolution.mock.calls[1][0].height).toBe(360);

    const files = mockUpdate.mock.calls[0][0].attrs.files;
    expect(files?.["720p"]).toBe(
      "https://output-bucket.s3.amazonaws.com/id-123_720p.mp4"
    );

    expect(files?.["360p"]).toBe(
      "https://output-bucket.s3.amazonaws.com/id-123_360p.mp4"
    );
    expect(files?.["240p"]).toBeFalsy();
  });

  test("should get single res if width is greater than or equal to 640 and less than 360", async () => {
    mockedGetMetadata.mockResolvedValue({
      fileSize: 1321,
      width: 854,
      height: 480,
      duration: 90,
    });
    await callHandler();
    expect(mockedAddResolution).toHaveBeenCalledTimes(1);
    expect(mockedAddResolution.mock.calls[0][0].width).toBe(640);
    expect(mockedAddResolution.mock.calls[0][0].height).toBe(360);

    const files = mockUpdate.mock.calls[0][0].attrs.files;
    expect(files?.["720p"]).toBeFalsy();
    expect(files?.["360p"]).toBe(
      "https://output-bucket.s3.amazonaws.com/id-123_360p.mp4"
    );
    expect(files?.["240p"]).toBeFalsy();
  });

  test("The res should not get changed if the width is less than 640", async () => {
    mockedGetMetadata.mockResolvedValue({
      fileSize: 1321,
      width: 426,
      height: 240,
      duration: 90,
    });
    await callHandler();
    expect(mockedAddResolution).toHaveBeenCalledTimes(1);
    expect(mockedAddResolution.mock.calls[0][0].width).toBe(426);
    expect(mockedAddResolution.mock.calls[0][0].height).toBe(240);

    const files = mockUpdate.mock.calls[0][0].attrs.files;
    expect(files?.["720p"]).toBeFalsy();
    expect(files?.["360p"]).toBeFalsy();
    expect(files?.["240p"]).toBe(
      "https://output-bucket.s3.amazonaws.com/id-123_240p.mp4"
    );
  });
});
