import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const healthCheck = asyncHandler(async (req, res, next) => {
  res.json(new ApiResponse(200, "Server is running"));
});
