/**
 * Todo
 * 
 * update the videoDoc status according to the event status
 * delete the object from upload bucket
 * 
 * status::
 * PROGRESSING,COMPLETE,ERROR
 */


import { VideoDB } from "../../entity/Video";
import { S3 } from "../../lib/s3";
import { handler } from "../mediaConvertEventHandler"

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
    userMetadata: {},
  },
};

function callHandler({ status }: { status: "PROGRESSING" | "COMPLETE" | "ERROR" }) {
  return (handler as any)(
    {
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
        status,
        userMetadata: {
          id: "video-doc-id-1"
        },
      },
    }
  )
}


describe('Test for mediaConverter event handler', () => {

  const mockUpdate = jest.spyOn(VideoDB.prototype, "update")
  const mockDeleteObject = jest.spyOn(S3.prototype, "deleteObject")

  beforeEach(() => {
    jest.resetAllMocks()
    mockUpdate.mockImplementation(() => undefined as any)
    mockDeleteObject.mockImplementation(() => undefined as any)
  })

  test('should pass the correct id in the update', async () => {
    await callHandler({ status: "PROGRESSING" })
    expect(mockUpdate.mock.calls[0][0].id).toBe("video-doc-id-1")

  })

  test('Should update the videoDoc with PROCESSING if status is PROGRESSING', async () => {
    await callHandler({ status: "PROGRESSING" })
    expect(mockUpdate.mock.calls[0][0].attrs.status).toBe("PROCESSING")
  })

  test('Should update the videoDoc with ERROR if status is ERROR', async () => {
    await callHandler({ status: "ERROR" })
    expect(mockUpdate.mock.calls[0][0].attrs.status).toBe("ERROR")
  });

  test('Should update the videoDoc with COMPLETE if status is READY', async () => {
    await callHandler({ status: "COMPLETE" })
    expect(mockUpdate.mock.calls[0][0].attrs.status).toBe("READY")
  })

  test('Should delete the source object in case of COMPLETE', async () => {
    await callHandler({ status: "COMPLETE" })
    expect(mockDeleteObject.mock.calls[0][0]).toBe('video-doc-id-1')
  })

  test('Should delete the source object in case of ERROR', async () => {
    await callHandler({ status: "ERROR" })
    expect(mockDeleteObject.mock.calls[0][0]).toBe('video-doc-id-1')
  })

  test('Should not delete the source object in case of PROGRESSING', async () => {
    await callHandler({ status: "PROGRESSING" })
    expect(mockDeleteObject).not.toHaveBeenCalled()
  })


})