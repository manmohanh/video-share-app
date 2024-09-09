/**
 * TODO for put handler
 *
 * Should validate the body properly
 *
 * Body should contain
 *  userId <String>
 *  title <String>
 *  description? <String>
 *  tags <String[]>
 *
 * If a valid body is passed save it in the database
 * Create pre-signed url
 * Send thar url to client
 *
 *
 */
import { DB } from "../../lib/db";
import { S3 } from "../../lib/s3";
import { handler } from "../putHandler";

describe("Test for the video put handler", () => {

  beforeEach(() => {
    jest.spyOn(DB.prototype,"save").mockImplementation((()=>{})as any)
    jest.spyOn(S3.prototype,"getUploadUrl").mockImplementation((() =>{}) as any)
  })

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("Should return a 400 statusCode If empty object is passed", async () => {
    const res = await (handler as any)({ body: JSON.stringify({}) });
    expect(res.statusCode).toBe(400);
  });

  test("Should call db save function if proper body is passed", async () => {
    const spySave = jest.spyOn(DB.prototype, "save");
    spySave.mockImplementation((async () => {}) as any);

    const res = await (handler as any)({
      body: JSON.stringify({
        userId: "user-123",
        title: "My Video",
      }),
    });

    expect(spySave).toHaveBeenCalled();
  });

  test("Should call the save method", async () => {
    const spySave = jest.spyOn(DB.prototype, "save");
    spySave.mockImplementation((async () => {}) as any);

    const res = await (handler as any)({
      body: JSON.stringify({
        userId: "user-123",
        title: "My Video",
      }),
    });

    expect(spySave).toHaveBeenCalled()
  });

  test("Should call the function to generate pre-signed url",async () => {

    const spyGetUploadUrl = jest.spyOn(S3.prototype,"getUploadUrl")
    spyGetUploadUrl.mockImplementation(async () => "http://upload-url.com")

    const res = await (handler as any)({
      body: JSON.stringify({
        userId: "user-123",
        title: "My Video",
      }),
    });

    expect(spyGetUploadUrl).toHaveBeenCalledTimes(1)
    expect(JSON.parse(res.body).uploadUrl).toBe("http://upload-url.com")

  })
});
