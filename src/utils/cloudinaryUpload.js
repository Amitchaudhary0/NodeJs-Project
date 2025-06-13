import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ResourceType = Object.freeze({
  IMAGE: "image",
  VIDEO: "video",
  RAW: "raw",
  AUTO: "auto",
});

export const uploadOnCloudinary = async (localFilePath, fileType, public_id = null, overwrite = false) => {
  try {
    if (!localFilePath) return null;

    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: ResourceType[fileType],
      public_id,
      overwrite,
    });
    console.log("File uploaded in Cloudinary Successfuly", uploadResult);
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    return uploadResult;
  } catch (error) {
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    console.log("Error while uploading file in Cloudinary", error?.message);
    return null;
  }
};
