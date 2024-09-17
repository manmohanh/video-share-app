import {
  CreateJobCommand,
  MediaConvertClient,
} from "@aws-sdk/client-mediaconvert";

interface Resolution {
  width: number;
  height: number;
  bitRate?: number;
  fileExtension?: string;
  nameExtension?: string;
}

interface VideoConverterConfig {
  roleArn: string;
  region: string;
  endpoint: string;
  inputFile: string;
  outputFile: string;
  userMetadata: Record<string, string>
}

export class VideoConverter {
  private resolutions: Resolution[] = [];

  constructor(private config: VideoConverterConfig) { }

  addResolution(res: Resolution) {
    this.resolutions.push(res);
  }

  private get client() {
    return new MediaConvertClient({
      region: this.config.region,
      endpoint: this.config.endpoint,
    });
  }

  async convert() {
    return this.client.send(
      new CreateJobCommand({
        UserMetadata: this.config.userMetadata,
        Role: this.config.roleArn,
        Settings: {
          TimecodeConfig: {
            Source: "ZEROBASED",
          },
          Inputs: [
            {
              AudioSelectors: {
                "Audio Selector 1": {
                  DefaultSelection: "DEFAULT",
                },
              },
              VideoSelector: {},
              TimecodeSource: "ZEROBASED",
              FileInput: this.config.inputFile,
            },
          ],
          OutputGroups: [
            {
              OutputGroupSettings: {
                Type: "FILE_GROUP_SETTINGS",
                FileGroupSettings: {
                  Destination: this.config.outputFile,
                },
              },
              Outputs: this.resolutions.map((res) => {
                return {
                  ContainerSettings: {
                    Container: "MP4",
                    Mp4Settings: {},
                  },
                  VideoDescription: {
                    CodecSettings: {
                      Codec: "H_264",
                      H264Settings: {
                        Bitrate: res.bitRate || 500000,
                        RateControlMode: "CBR",
                      },
                    },
                    Height: res.height,
                    Width: res.width,
                  },
                  Extension: res.fileExtension || "mp4",
                  NameModifier:
                    res.nameExtension || `_${res.width}x${res.height}`,
                };
              }),
            },
          ],
        },
      })
    );
  }
}
