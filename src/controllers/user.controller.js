import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrorHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinaryUpload.js";
import jwt from "jsonwebtoken";

const options = {
  httpOnly: true,
  secure: true,
};

const generateAccessAndRefreshTokens = async user => {
  // for now i have used user but we have to send the userId
  try {
    // const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validBeforeSave: false }); // we have to make sure we are not valiating user because we just want to save the refresh token

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh tokens & access tokens");
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  // get data from frontend
  // once we get the data from frontend we have to check all the validation
  // check do user exists
  // once you done that upload the file to cloudnary
  // once the file is uploaded in cloudnary we have to check weather the file is uploaded or not
  // if the file is uploaded we have to send the data as a response but i have to remove the password and refresh token

  const { fullName, username, email, password } = req.body;

  const missingFields = [];
  if (!fullName?.trim()) missingFields.push("Full name");
  if (!username?.trim()) missingFields.push("Username");
  if (!email?.trim()) missingFields.push("Email");
  if (!password?.trim()) missingFields.push("Password");

  if (missingFields.length > 0) {
    throw new ApiError(400, `Missing fields: ${missingFields.join(", ")}`);
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User Already exists by entered User Name or Email");
  }

  const avatarLocalPathName = req?.files?.avatar?.[0]?.path;
  let coverImageLocalPathName;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPathName = req.files.coverImage?.[0].path;
  }

  if (!avatarLocalPathName) throw new ApiError(400, "Avatar image is required");

  const avatar = await uploadOnCloudinary(avatarLocalPathName, "IMAGE");
  const coverImage = await uploadOnCloudinary(coverImageLocalPathName, "IMAGE");

  if (!avatar) {
    if (avatarLocalPathName) {
      // retry to upload
      avatar = await uploadOnCloudinary(avatarLocalPathName);
    } else {
      throw new ApiError(400, "Failed to upload files to Cloudinary");
    }
  }

  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: { url: avatar.url, id: avatar.public_id },
    coverImage: { url: coverImage?.url, id: coverImage?.id } || {},
    refreshToken: null,
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken -avatar.id -coverImage.id");

  if (!createdUser) throw new ApiError(500, "something went wrong while registering user");

  const responseData = {
    username: createdUser.username,
    email: createdUser.email,
    fullName: createdUser.fullName,
    avatar: createdUser.avatar?.url,
    coverImage: createdUser.coverImage?.url,
    watchHistory: createdUser.watchHistory,
  };

  res.status(201).json(new ApiResponse(200, "User registered successfuly", responseData));
});

export const loginUser = asyncHandler(async (req, res) => {
  // Take user data from req.body
  // check user data or not
  // check weather the user exist in db
  // if user exist compare the passowrd user entered with the password we have saved in the data base using bcrypt
  // if user password matches generate accessToken and refreshToken
  // store the refresh token in the database
  // send the accessToken and refreshToken to user using cookiee parser or using simple api respnse
  // also remove the unwanted fields from the api response

  const { username, email, password } = req.body || {};
  if (!username && !email) throw new ApiError(400, "Please enter username or email");

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) throw new ApiError(401, "User not found");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(400, "Invalid user credentials");

  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(user); //here we have to give the userId which we will give from user._id

  // const loggedInUser = await User.findById(user._id).select("-refreshToken -password"); //we have done this to get the user details except refreshtoken and password also the refresh token would be empty in this case

  const responseData = {
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    avatar: user.avatar?.url,
    watchHistory: user.watchHistory,
    // refreshToken,
    accessToken,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, "User loggedin Successfully", responseData));
});

export const logoutUser = asyncHandler(async (req, res, _) => {
  // i will take the user id from the auth middleware
  // find that user to run FindAndUpdate command
  // now i will update the refresh token to undefined
  // Also i have to check it should be updated ASAP
  // Final step will be to clear the cookie from the browser

  await User.findByIdAndUpdate(req.user?._id, { $set: { refreshToken: null } }, { new: true });
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logout successfuly", {}));
});

export const refreshUserToken = asyncHandler(async (req, res) => {
  // get refresh token
  // Check for refresh token
  // generate new access token
  // send updated access token to user

  const oldRefreshToken = req.body?.refreshToken || req.cookies?.refreshToken;

  if (!oldRefreshToken) throw new ApiError(401, "Unauthorized request");
  try {
    const decodedToken = await jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);
    if (!user) throw new ApiError(401, "Invalid refresh token");

    if (oldRefreshToken !== user?.refreshToken) throw new ApiError(400, "Refresh token is expired");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user);
    const responseData = {
      username: user.username,
      emai: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      watchHistory: user.watchHistory,
      refreshToken,
      accessToken,
    };

    return res
      .status(200)
      .cookie(refreshToken, options)
      .cookie(accessToken, options)
      .json(new ApiResponse(200, "Access and Refresh token generated succesfully", responseData));
  } catch (error) {
    throw new ApiError(401, error?.message || "Something went wrong while Refreshing User Token");
  }
});

export const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email, username } = req.body;

  if (!(fullName || email || username)) throw new ApiError(400, "Please enter Full Name or Email or User Name");

  try {
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          username,
          email,
        },
      },
      { new: true }
    ).select("-password -refreshToken -avatar.id -coverImage.id");

    if (!user) throw new ApiError(400, "Unauthorized request");

    const { avatar, coverImage, ...rest } = user?._doc;

    return res
      .status(200)
      .json(new ApiResponse(200, "User Details Updated Sucessfully", { ...rest, avatar: avatar?.url, coverImage: coverImage?.url }));
  } catch (error) {
    throw new ApiError(400, error?.message || "Something went wrong while updating user details");
  }
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
  const localPathName = req.file?.path;
  if (!localPathName) throw new ApiError(400, "Avatar Image is required");
  try {
    const uploadedImage = await uploadOnCloudinary(localPathName, "IMAGE", req.user?.avatar?.id, true);

    if (!uploadedImage) throw new ApiError(401, "Failed to upload image");

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: { avatar: { url: uploadedImage?.url, id: uploadedImage?.public_id } } },
      { new: true }
    ).select("-password -refreshToken -avatar.id");
    if (!user) throw new ApiError(401, "Unauthorized request");

    const { password, avatar, coverImage, refreshToken, ...rest } = user?._doc;

    return res.status(200).json(new ApiResponse(200, "Avatar updated Sucessfully", { ...rest, avatar: avatar?.url, coverImage: coverImage?.url }));
  } catch (error) {
    throw new ApiError(401, error?.message || "Something went wrong while updating Avatar");
  }
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
  const localPathName = req.file?.path;
  if (!localPathName) throw new ApiError(400, "Cover Image is required");
  try {
    const uploadedImage = await uploadOnCloudinary(localPathName, "IMAGE", req.user?.coverImage?.id, true);

    if (!uploadedImage) throw new ApiError(401, "Failed to upload image");

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: { coverImage: { url: uploadedImage?.url, id: uploadedImage?.public_id } } },
      { new: true }
    ).select("-password -refreshToken -avatar.id");
    if (!user) throw new ApiError(401, "Unauthorized request");

    const { password, avatar, coverImage, refreshToken, ...rest } = user?._doc;

    return res
      .status(200)
      .json(new ApiResponse(200, "coverImage updated Sucessfully", { ...rest, avatar: avatar?.url, coverImage: coverImage?.url }));
  } catch (error) {
    throw new ApiError(401, error?.message || "Something went wrong while updating Avatar");
  }
});

export const updateUserPassword = asyncHandler(async (req, res) => {
  // take user input
  // varify user input
  // varify oldPassword from the password saved in DB
  // if password is correct change the current password

  const { oldPassword, newPassword, confirmPassword } = req.body;
  const missingFields = [];
  if (!oldPassword) missingFields.push("Old password");
  if (!newPassword) missingFields.push("New password");
  if (!confirmPassword) missingFields.push("Confirm password");
  if (missingFields.length > 0) {
    throw new ApiError(400, `${missingFields.join(", ")} is required`);
  } else if (!(newPassword === confirmPassword)) {
    throw new ApiError(400, "New password and Confirm password doesn't match");
  }
  try {
    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(400, "Unauthorized request");
    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isOldPasswordCorrect) throw new ApiError(401, "Please enter valid Password Old password doesn't match");
    user.password = newPassword;
    await user.save({ validBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, "Password updated sucessfully"));
  } catch (error) {
    throw new ApiError(500, error?.message ?? "Something went wrong while updating password");
  }
});
