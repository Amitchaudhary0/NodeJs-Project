import express from "express";
import "dotenv/config";
import { connectDB } from "./db/index.js";
import mongoose from "mongoose";

const app = express();

connectDB();

// ======================================================================================================
//                MongoDB Database Connect with efi (()=>{})() Immediately executable function
// ======================================================================================================
// (async () => {
//   try {
//     const databaseInstance = await mongoose.connect(
//       `${process.env.MONGODB_URI}`
//     );
//     console.log(
//       "MongoDb Database connected succesfully!!!",
//       databaseInstance?.connection?.host
//     );
//   } catch (error) {
//     console.log("There is an error while connecting with database: ", error);
//   }
// })();

app
  .listen(process.env.PORT || 8000, () => {
    console.log("production grade code is running in port:", process.env.PORT);
  })
  .on(error => {
    console.log("Error in Node App", error);
  });
