import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async () => {
  try {
    if (!localFilePath) throw new Error("Local file path not found");
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log(`File Uploaded Successfully on Cloudinary ${response.url}`);
    return response.url;
  } catch (error) {
    // Remove the locally saved file after the upload failed
    fs.unlinkSync(localFilePath);
    return null;
  }
};
