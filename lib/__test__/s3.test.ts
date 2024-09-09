import { S3 } from "../s3";

describe("Test for s3", () => {
  test("should return the signed url", async () => {
    const s3 = new S3({
      region: "api-south-1",
      bucketName: "test-bucket",
    });

    const url = await s3.getUploadUrl({
      key: "test.png",
      expiresIn: 60,
    });

    expect(url.includes('test-bucket')).toBe(true)
    expect(url.includes('test.png')).toBe(true)
  });
});
