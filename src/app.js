import express from "express";
const app = express();
import cookieParser from "cookie-parser";
import cors from "cors";
import { userRouter } from "./routes/user.route.js";
import { staticRouter } from "./routes/static.route.js";
import { videoRouter } from "./routes/video.route.js";
import router from "./routes/comment.route.js";

app.use(cookieParser());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use("/users", userRouter);
app.use("/", staticRouter);
app.use("/videos", videoRouter);
app.use("/comments", router);

export { app };
