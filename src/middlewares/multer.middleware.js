import multer from "multer";
import { uploadOnCloudinary } from "../utils/cloudinary";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname);
  },
});

// const localFilePath = storage.destination / storage.filename;
// uploadOnCloudinary(localFilePath);

export const upload = multer({ storage });
