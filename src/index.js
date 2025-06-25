import dotenv from "dotenv";
import { app } from "./app.js";
dotenv.config();
import { connectToDB } from "./db/index.js";

connectToDB()
  .then(() => {
    app.listen(process.env.PORT, () =>
      console.log(`Server Running at http://localhost:${process.env.PORT}`)
    );
  })
  .catch((error) => {
    console.log("Error Connecting to DB", error);
    process.exit(1);
  });
