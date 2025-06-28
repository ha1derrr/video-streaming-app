import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeUserPassword,
  updateUserDetails,
  updateAvatar,
  getUserChannelProfile,
  getUserWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

userRouter.route("/login").post(loginUser);

// Logged-In user routes

userRouter.route("/logout").post(jwtVerify, logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter.route("/change-password").patch(jwtVerify, changeUserPassword);
userRouter.route("/update-user").patch(jwtVerify, updateUserDetails);
userRouter
  .route("/update-avatar")
  .patch(jwtVerify, upload.single("avatar"), updateAvatar);
userRouter
  .route("/get-channel-info/:username")
  .get(jwtVerify, getUserChannelProfile);
userRouter.route("/get-watch-history").get(jwtVerify, getUserWatchHistory);

export { userRouter };
