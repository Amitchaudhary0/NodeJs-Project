import { connect } from "mongoose";
import { DATABASE_NAME } from "../constants.js";

export async function connectDB() {
  try {
    const connectionInstance = await connect(
      `${process.env.MONGODB_URI}/${DATABASE_NAME}`,
      {
        authSource: "admin",
      }
    );
    console.log(
      "Database connected successfully!!",
      connectionInstance.connection.host
    );
  } catch (error) {
    console.log("There is an error connecting Database: ", error);
    process.exit(1);
  }
}
