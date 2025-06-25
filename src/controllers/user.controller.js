// import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  //You update and save that one — but your original user variable
  //outside the function doesn’t magically get updated.
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  console.log("Token is", accessToken);
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
    res.status(201).json({ "User created successfully": createdUser });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email) {
      throw new Error("username or email is missing");
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
    console.log(`User refresh token ${user.refreshToken}`);

    const loggedInUser = await User.findOne(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({ user: loggedInUser, refreshToken, accessToken });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        refreshToken: undefined,
      },
    });
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

export { registerUser, loginUser, logoutUser };
