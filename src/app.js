import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

export const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ================================================================================
//                            ----⏬ Router Imports ⏬----
// ================================================================================
import userRouter from "./routes/user.route.js";
import { healthCheck } from "./controllers/healthCheck.controller.js";

// ================================================================================
//                            ----⏬ Define Routes ⏬----
// ================================================================================
app.use("/api/v1/users", userRouter);
app.get("/api/v1/healthCheck", healthCheck);
