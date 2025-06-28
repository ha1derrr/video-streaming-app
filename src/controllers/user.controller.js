// import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  //You update and save that one — but your original user variable
  //outside the function doesn’t magically get updated.
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  // console.log("Token is", accessToken);
  return { accessToken, refreshToken };
};

const registerUser = async (req, res, next) => {
  // get user details from frontend
  // check if details sent are empty
  // check if user already exists using either email or username
  // check for avatar image
  // upload avatar url to cloudinary
  // Check whether cloudinary returned a url or not
  // Now create a User object
  // remove password and refresh token field
  // check for user creation
  // return res
  // Works too - if([email,fullName,password,username,].some(field => !field?.trim())){}
  try {
    const { email, fullName, password, username } = req.body;

    if (
      [email, username, fullName, password].some(
        // checks for string with spaces and without spaces
        // because both of them are considered to be non null and non undefined
        (field) => field?.trim() === ""
      )
    ) {
      throw new Error("One or more fields are missing ");
    }
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      throw new Error("User already exists");
    }
    // The .files is sent by multer and contains the files info
    // These are the files that it uploaded locally
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // The code below won't work if the user has not sent any coverImage
    // And the array will go unnoticed
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
    ) {
      coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) throw new Error("Avatar File Required");

    // The avatar and coverImage are the response objects sent from cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) throw new Error("No Avatar URL returned from cloudinary");
    const user = await User.create({
      username: username.toLowerCase(),
      email,
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      password,
    });
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser)
      throw new Error("Something went wrong while creating user");
    res.status(201).json({
      user: createdUser,
      status: 201,
      message: "User registered successfully",
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username && !email) {
      throw new Error("Email or username is required");
    }
    const user = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (!user) throw new Error("User does not exist");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new Error("Incorrect Passsword");

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    // User refresh token is undefined
    // console.log(`User refresh token ${user.refreshToken}`);

    const loggedInUser = await User.findOne(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        user: loggedInUser,
        refreshToken,
        accessToken,
        message: "User logged in",
      });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          // Removes the field from the document using the flag 1
          refreshToken: 1,
        },
      }
      // new:true returns the updated document or entry
      //{ new: true }
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ Success: "User LoggedOut" });
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async (req, res, next) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new Error("No refresh token found");
  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const user = await User.findById(decodedToken?._id);
  // Might be the frontend sent a fake token and user doesn't exists on our database
  if (!user) throw new Error("Invalid refresh token");

  if (incomingRefreshToken !== user?.refreshToken)
    throw new Error("Refresh Token Expired or used");
  // For the above case we will redirect the user to login again

  const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json({
      message: "New Access Token and Refresh Token Generated",
      accessToken,
      newRefreshToken,
    });
};

const changeUserPassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      throw new Error("One of the field is missing");
    // req.user is generated by the middleware jwtVerify
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) throw new Error("Invalid Password");
    user.password = newPassword;
    user.save({ validateBeforeSave: false });
    return res.status(201).send("Password Updated Successfully");
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    return res.json(req.user);
  } catch (error) {
    next(error);
  }
};

const updateUserDetails = async (req, res, next) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) throw new Error("One of the field is missing");
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    // The {new:true} returns the updated user
    { new: true }
  ).select("-password -refreshToken");

  return res.json({ "Updated User": updatedUser });
};

const updateAvatar = async (req, res, next) => {
  try {
    const localFilePath = req.file?.path;
    if (!localFilePath) throw new Error("User didn't upload avatar");
    const avatar = await uploadOnCloudinary(localFilePath);
    if (!avatar) throw new Error("Cloudinary didn't respond");
    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      {
        new: true,
      }
    ).select("-password -refreshToken");
    return res.json({ updatedUser, message: "Avatar Updated Successfully" });
  } catch (error) {
    next(error);
  }
};

const getUserChannelProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    if (!username?.trim()) throw new Error("Username Required");
    const channel = await User.aggregate([
      {
        $match: { username: username?.toLowerCase() },
      },
      {
        $lookup: {
          from: "subsrciptions",
          localField: "_id", // Found in the matched document
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subsrciptions",
          localField: "_id", // Found in the matched document
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            // $ with subscribers because now it is a field
            $size: "$subscribers",
          },
          channelsSubscribedToCount: {
            // $ with subscribedTo because now it is a field
            $size: "$subscribedTo",
          },
          isSubscribed: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          email: 1,
          avatar: 1,
          coverImage: 1,
          subscribersCount: 1,
          channelsSubscribedToCount: 1,
          isSubscribed: 1,
        },
      },
    ]);
    if (!channel) throw new Error("Channel doesn't exist");
    return res.json({ channel: channel[0] });
  } catch (error) {
    next(error);
  }
};

const getUserWatchHistory = async (req, res, next) => {
  try {
    const user = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.user?._id) },
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
              },
            },
            {
              $project: {
                username: 1,
                fullName: 1,
              },
            },
            {
              $addFields: {
                owner: { $first: "$owner" },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          watchHistory: { $first: "$watchHistory" },
        },
      },
      {
        $project: {
          fullName: 1,
          email: 1,
          username: 1,
          description: 1,
          thumbnail: 1,
          watchHistory: 1,
        },
      },
    ]);

    if (!user?.length) throw new Error("No watch history");

    return res.status(200).json({
      user: user[0],
      message: "Fetched User History",
    });
  } catch (error) {
    next(error);
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeUserPassword,
  getCurrentUser,
  updateUserDetails,
  updateAvatar,
  getUserChannelProfile,
  getUserWatchHistory,
};
