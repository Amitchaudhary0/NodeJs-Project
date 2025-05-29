import { Router } from "express";
import { loginUser, logoutUser, refreshUserToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/fileUpload.middleware.js";
import { authenticatUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(authenticatUser, logoutUser);
router.route("/refreshUserToken").post(refreshUserToken);

export default router;
