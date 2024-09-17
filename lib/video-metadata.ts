import childProcess from "child_process";

const samplePayload = {
  creatingLibrary: {
    name: "MediaInfoLib",
    version: "23.04",
    url: "https://mediaarea.net/MediaInfo",
  },
  media: {
    "@ref":
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    track: [
      {
        "@type": "General",
        VideoCount: "1",
        AudioCount: "1",
        FileExtension: "mp4",
        Format: "MPEG-4",
        Format_Profile: "Base Media / Version 2",
        CodecID: "mp42",
        CodecID_Compatible: "isom/avc1/mp42",
        FileSize: "158008374",
        Duration: "596.473",
        OverallBitRate_Mode: "VBR",
        OverallBitRate: "2119236",
        FrameRate: "24.000",
        FrameCount: "14315",
        StreamSize: "179663",
        HeaderSize: "179655",
        DataSize: "157828719",
        FooterSize: "0",
        IsStreamable: "Yes",
        Encoded_Date: "2010-01-10 08:29:06 UTC",
        Tagged_Date: "2010-01-10 08:29:06 UTC",
        extra: {
          gsst: "0",
          gstd: "596961",
          gssd: "BADC219C2HH1385162467077729",
          gshh: "r8---sn-o097zned.googlevideo.com",
        },
      },
      {
        "@type": "Video",
        StreamOrder: "1",
        ID: "2",
        Format: "AVC",
        Format_Profile: "High",
        Format_Level: "3.1",
        Format_Settings_CABAC: "Yes",
        Format_Settings_RefFrames: "3",
        Format_Settings_GOP: "M=1, N=30",
        CodecID: "avc1",
        Duration: "596.458",
        BitRate: "1991288",
        BitRate_Maximum: "5372792",
        Width: "1280",
        Height: "720",
        Sampled_Width: "1280",
        Sampled_Height: "720",
        PixelAspectRatio: "1.000",
        DisplayAspectRatio: "1.778",
        Rotation: "0.000",
        FrameRate_Mode: "CFR",
        FrameRate: "24.000",
        FrameRate_Num: "24",
        FrameRate_Den: "1",
        FrameCount: "14315",
        ColorSpace: "YUV",
        ChromaSubsampling: "4:2:0",
        BitDepth: "8",
        ScanType: "Progressive",
        StreamSize: "148465020",
        Title: "(C) 2007 Google Inc. v08.13.2007.",
        Encoded_Date: "2010-01-10 08:29:06 UTC",
        Tagged_Date: "2010-01-10 08:29:20 UTC",
        extra: {
          CodecConfigurationBox: "avcC",
        },
      },
      {
        "@type": "Audio",
        StreamOrder: "0",
        ID: "1",
        Format: "AAC",
        Format_AdditionalFeatures: "LC",
        CodecID: "mp4a-40-2",
        Duration: "596.473",
        BitRate_Mode: "VBR",
        BitRate: "125488",
        BitRate_Maximum: "169368",
        Channels: "2",
        ChannelPositions: "Front: L R",
        ChannelLayout: "L R",
        SamplesPerFrame: "1024",
        SamplingRate: "44100",
        SamplingCount: "26304459",
        FrameRate: "43.066",
        FrameCount: "25688",
        Compression_Mode: "Lossy",
        StreamSize: "9363691",
        Title: "(C) 2007 Google Inc. v08.13.2007.",
        Encoded_Date: "2010-01-10 08:29:06 UTC",
        Tagged_Date: "2010-01-10 08:29:20 UTC",
      },
    ],
  },
};


interface Metadata {
  width: number;
  height: number;
  fileSize: number;
  duration: number;
}

export class VideoMetadata {
  constructor(private config: { mediaInfoCliPath: string }) {}
  async fromUrl(url: string): Promise<Metadata> {
    return new Promise((resolve,reject) => {
      childProcess.exec(`${this.config.mediaInfoCliPath} --output=JSON '${url}'`,(err,data)=>{
        if(err) return reject(err);
        const payload = JSON.parse(data) as typeof samplePayload
        resolve({
          fileSize:parseInt(payload.media.track[0].FileSize!),
          height:parseInt(payload.media.track[1].Height!),
          width:parseInt(payload.media.track[1].Width!),
          duration:parseInt(payload.media.track[1].Duration)
        }) 
      });
    });
  }
}
