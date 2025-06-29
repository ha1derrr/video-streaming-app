import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const jwtVerify = async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization").replace("Bearer ", "");
    // req.cookies?.accessToken || req.header("Authorization").split(" ")[1];

    if (!accessToken) throw new Error("Unauthorized Request");
    const decodedInfo = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    const user = await User.findById(decodedInfo?._id).select(
      "-password -refreshToken"
    );

    if (!user) throw new Error("Invalid Access Token");
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
