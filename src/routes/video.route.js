import {
  getAllVideos,
  getVideoById,
  publishAVideo,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} from "../controllers/video.controller.js";
import { Router } from "express";
import { jwtVerify } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const videoRouter = Router();

videoRouter.route("/get-all-videos").post(getAllVideos);
videoRouter.route("/publish-video").post(
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  jwtVerify,
  publishAVideo
);
videoRouter.route("/get-video-by-id/:videoId").get(getVideoById);
videoRouter
  .route("/update-video/:videoId")
  .patch(upload.single("thumbnail"), jwtVerify, updateVideo);

videoRouter.route("/delete-video/:videoId").patch(jwtVerify, deleteVideo);

videoRouter
  .route("/change-publish-status/:videoId")
  .patch(jwtVerify, togglePublishStatus);
export { videoRouter };
