import express from "express";
const app = express();
import cookieParser from "cookie-parser";
import cors from "cors";

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

app.get("/", (req, res) =>
  res.json({
    result: [
      {
        name: "Haider",
        course: "MCA",
        profession: "Web Dev",
      },
    ],
  })
);

export { app };
