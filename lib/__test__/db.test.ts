import { DB } from "../db";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

describe("Test for DB", () => {
  test.skip("should save the data in the database", async () => {
    const db = new DB<any>({
      tableName: "video-share",
      region: "ap-south-1",
    });

    const res = await db.save({
      id: "123",
      userId: "user-123",
      tags: undefined,
    });

    console.log(res);
  });

  test("should pass proper input to the update", async () => {
    const mockedSend = jest
      .spyOn(DynamoDBDocumentClient.prototype, "send")
      .mockImplementation(async () => {});

    const db = new DB<{
      id: string;
      title: string;
      description: string;
    }>({
      tableName: "video-share",
      region: "ap-south-1",
    });

    const res = await db.update({
      id: "123",
      attrs: {
        title: "new-title",
        description: "new-description",
      },
    });

    const input = mockedSend.mock.calls[0][0].input as any;
    expect(input.UpdateExpression).toBe(
      "set #title=:title, #description=:description"
    );

    expect(input.ExpressionAttributeNames).toEqual({
      "#title": "title",
      "#description": "description",
    });
    expect(input.ExpressionAttributeValues).toEqual({
      ":title": "new-title",
      ":description": "new-description",
    });
  });
});
