import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      lowercase: true,
      unique: [true, "username must be unique"],
      required: [true, "username is required"],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "email is required"],
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "full name is required"],
      trim: true,
      index: true,
    },
    avatar: { type: Object },
    coverImage: { type: Object },
    password: { type: String, required: [true, "password is required"] },
    refreshToken: { type: String },
    watchHistory: [{ type: Schema.Types.ObjectId, ref: "Video" }],
  },
  { timestamps: true }
);

// =======================================================================================================
// schemaName.pre is used to just do anyshort of opration or thing before save or other things
// =======================================================================================================
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// =========================================================================================================
// schemaName.methods is used to define some methods the below method is uesd to check the password
// =========================================================================================================
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// =========================================================================================================
//                      JWT token helps you create the token by which we can get the access
//                                          --AccessToken--
// =========================================================================================================
userSchema.methods.generateAccessToken = async function () {
  return await jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
      fullName: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// =========================================================================================================
//                                          --RefrshToken--
// =========================================================================================================
userSchema.methods.generateRefreshToken = async function () {
  return await jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = model("User", userSchema);
