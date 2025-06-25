import { connect } from "mongoose";

export const connectToDB = async () => {
  try {
    await connect(process.env.MONGO_URL);
    console.log("Database Connected Successfully");
  } catch (error) {
    console.log("Error Connecting DB");
    throw error;
  }
};
