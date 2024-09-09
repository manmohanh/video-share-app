import { DB } from "../db";

describe.skip("Test for DB", () => {
  test("should save the data in the database", async () => {

    const db = new DB({
      tableName: "video-share",
      region: "ap-south-1"
    });

    const res = await db.save({
      id:"123",
      userId: "user-123",
      tags:undefined
    })

    console.log(res)


  });
});
