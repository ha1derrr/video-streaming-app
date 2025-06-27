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
userRouter.route("/change-password").put(jwtVerify, changeUserPassword);
userRouter.route("/update-user").put(jwtVerify, updateUserDetails);
userRouter
  .route("update-avatar")
  .put(jwtVerify, upload.single({ name: "avatar", maxCount: 1 }), updateAvatar);
userRouter.route("/getChannelInfo/:username").post(getUserChannelProfile);

export { userRouter };
