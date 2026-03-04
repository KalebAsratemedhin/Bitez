import { v2 as cloudinary } from "cloudinary";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export class CloudinaryService {
  constructor(config: CloudinaryConfig) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    });
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    options?: { mimetype?: string }
  ): Promise<string> {
    const mimetype = options?.mimetype ?? "image/jpeg";
    const b64 = buffer.toString("base64");
    const dataUri = `data:${mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `bitez/${folder}`,
      resource_type: "image",
    });
    return result.secure_url;
  }
}
