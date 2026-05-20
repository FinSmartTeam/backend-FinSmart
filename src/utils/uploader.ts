import { v2 as cloudinary } from "cloudinary";

import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from "./env";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const toDataURL = (file: Express.Multer.File) => {
  const base64 = Buffer.from(file.buffer).toString("base64");
  const dataURL = `data:${file.mimetype};base64,${base64}`;
  return dataURL;
};

const getPublicIdFromUrl = (fileUrl: string) => {
  const fileNameUsingSubstring = fileUrl.substring(
    fileUrl.lastIndexOf("/") + 1,
  );
  const publicId = fileNameUsingSubstring.substring(
    0,
    fileNameUsingSubstring.lastIndexOf("."),
  );
  return publicId;
};

export default {
  async uploadSingle(file: Express.Multer.File) {
    try {
      if (!file) {
        throw new Error("No file provided");
      }
      const fileDataURL = toDataURL(file);
      const result = await cloudinary.uploader.upload(fileDataURL, {
        resource_type: "auto",
      });
      return result;
    } catch (error) {
      console.log("Upload single error: ", error);
      throw new Error("Upload single file failed");
    }
  },

  async uploadMultiple(files: Express.Multer.File[]) {
    try {
      const uploadBatch = files.map((item) => {
        const result = this.uploadSingle(item);
        return result;
      });
      const uploadResults = await Promise.all(uploadBatch);
      return uploadResults;
    } catch (error) {
      console.log("Upload multiple error: ", error);
      throw new Error("Upload multiple files failed");
    }
  },

  async remove(fileUrl: string) {
    try {
      const publicId = getPublicIdFromUrl(fileUrl);
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.log("Remove file error: ", error);
      throw new Error("Remove file failed");
    }
  },
};