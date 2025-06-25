import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res, next) => {
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
  const { email, fullName, password, username } = req.body;

  if (
    [email, username, fullName, password].some((field) => field?.trim() === "")
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
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) throw new Error("Avatar File Required");

  // The avatar and coverImage are the urls of the images uploaded on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) throw new Error("No Avatar URL returned from cloudinary");
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: avatar,
    coverImage: coverImage?.url || "",
    password,
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) throw new Error("Something went wrong while creating user");
  res.status(201).json({ "User created successfully": createdUser });
});

export { registerUser };
