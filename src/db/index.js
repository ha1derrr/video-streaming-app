import { connect } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";

export const connectToDB = asyncHandler(
  async () => await connect(process.env.MONGO_URL)
);
