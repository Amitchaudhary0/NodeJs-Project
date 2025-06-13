import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiErrorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

export const authenticatUser = asyncHandler(async (req, res, next) => {
  // get accessToken from req.cookie from cookie parser because we have injected cookie parser middleware
  // use jwt to get the user details which are encoded within the jwt token
  // use user details to findbyId the user
  // if user is found then we have to pass the user req.user=user
  try {
    const token = req.cookies?.accessToken || req.header("authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "Unauthorized request");
    const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodeToken?._id).select("-password -refreshToken -avatar.id -coverImage.id");
    if (!user) throw new ApiError(401, "Invalid Access Token");

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized token");
  }
});
