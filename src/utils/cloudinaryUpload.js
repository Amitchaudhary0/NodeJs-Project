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

const uploadOnCloudinary = async (localFilePath, fileType) => {
  try {
    if (!localFilePath) return null;

    const uploadResult = await cloudinary.uploader.upload(localFilePath, { resource_type: ResourceType[fileType] });
    console.log("File uploaded in Cloudinary Successfuly", uploadResult?.url);
    return uploadResult;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log("Error while uploading file in Cloudinary", error);
    return null;
  }
};
