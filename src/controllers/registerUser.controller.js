import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrorHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinaryUpload.js";

const generateAccessAndRefreshTokens = async user => {
  // for now i have used user but we have to send the userId
  try {
    // const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validBeforeSave: false }); // we have to make sure we are not valiating user because we just want to save the refresh token

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh tokens & access tokens");
  }
};

export const registerUser = asyncHandler(async (req, res, next) => {
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

  const avatarLocalPathName = req?.files?.avatar[0]?.path;
  let coverImageLocalPathName;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPathName = req.files.coverImage[0].path;
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
    avatar: avatar.url,
    coverImage: coverImage?.url || null,
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) throw new ApiError(500, "something went wrong while registering user");

  res.status(201).json(new ApiResponse(200, "User registered successfuly", createdUser));
});

export const loginUser = asyncHandler(async (req, res, next) => {
  // Take user data from req.body
  // check user data or not
  // check weather the user exist in db
  // if user exist compare the passowrd user entered with the password we have saved in the data base using bcrypt
  // if user password matches generate accessToken and refreshToken
  // store the refresh token in the database
  // send the accessToken and refreshToken to user using cookiee parser or using simple api respnse
  // also remove the unwanted fields from the api response

  const { username, email, password } = req.body;
  if (!username && !email) throw new ApiError(400, "Please enter username or email");

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) throw new ApiError(401, "User not found");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(400, "Invalid user credentials");

  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(user); //here we have to give the userId which we will give from user._id

  // const loggedInUser = await User.findById(user._id).select("-refreshToken -password"); //we have done this to get the user details except refreshtoken and password also the refresh token would be empty in this case

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { user: user, refreshToken, accessToken }, "User loggedin Successfully"));
});
