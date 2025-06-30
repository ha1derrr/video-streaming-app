import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  if (
    [page, limit, query, sortBy, sortType, userId].some(
      (field) => !field?.trim()
    )
  )
    throw new ApiError(404, "Some fields are missing");
  const pageNumber = parseInt(page);
  const pageLimit = parseInt(limit);
  const skip = (pageNumber - 1) * pageLimit;
  const options = {
    page: pageNumber,
    limit: pageLimit,
    skip: skip,
  };
  const matchStage = {
    isPublished: true,
    title: { $regex: query, $options: "i" },
  };
  const sortStage = {
    [sortBy]: sortType === "asc" ? 1 : -1,
  };
  const aggregate = Video.aggregate([
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $project: {
        videoFile: 1,
        owner: 1,
        thumbnail: 1,
      },
    },
    {
      $sort: sortStage,
    },
  ]);

  const result = await Video.aggregatePaginate(aggregate, options);
  if (!result) throw new ApiError(501, "Cannot find videos");
  //   console.log(result);
  return res
    .status(200)
    .json(new ApiResponse(201, result.docs[0], "Fetched Videos"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title || !description)
    throw new ApiError(404, "One of the field is missing");
  const videoFileLocalPath = req.files?.videoFile[0].path;
  console.log("Video File Local Path", videoFileLocalPath);
  const thumbnailFileLocalPath = req.files?.thumbnail[0].path;
  const video = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);
  if (!video || !thumbnail) throw new ApiError("Error from Cloudinary");
  // console.log("User Id", req.user?._id);
  const publishedVideo = await Video.create({
    videoFile: video?.url,
    thumbnail: thumbnail?.url,
    title,
    description,
    owner: req.user?._id,
    duration: video.duration, // Comes from cloudinary after upload
  });
  if (!publishedVideo) throw new Error(500, "Error publishing video");
  return res
    .status(200)
    .json(new ApiResponse(200, publishedVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) throw new ApiError(404, "Video Id is required");
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError("Video not found in the database");
  return res
    .status(200)
    .json(new ApiResponse(200, video.videoFile, "Video Found"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  if (!title || !description) throw new ApiError("One of the field is missing");
  const thumbnailFileLocalPath = req.file?.path;
  if (!thumbnailFileLocalPath) throw new ApiError("Thumbnail is missing");
  const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);
  //   if(!req.user?._id) throw new Error('You are not loggedIn')
  const owner = await Video.findOne({ owner: req.user?._id });
  if (!owner) throw new Error("You are not authorized to update this video");
  //   console.log("User is", owner);
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
      thumbnail: thumbnail.url,
    },
    { new: true }
  ).select("title description thumbnail");
  if (!video) throw new ApiError("Invalid video Id");
  return res
    .status(200)
    .json(new ApiResponse(201, video, "Updated video details successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) throw new Error("No video Id provided");
  const isVideoAvailable = await Video.findById(videoId);
  if (!isVideoAvailable) throw new Error("Video already deleted");
  const owner = await Video.findOne({ owner: req.user?._id });
  if (!owner) throw new Error("You are not authorized to delete this video");
  const result = await Video.findByIdAndDelete(videoId);
  // Can also be done using Video.deleteOne({_id:videoId})
  if (!result) throw new Error("Invalid video id");
  return res
    .status(201)
    .json(new ApiResponse(201, result, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(404, "Video Id missing");
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video Doesn't exist");
  const response = await Video.findByIdAndUpdate(
    videoId,
    {
      isPublished: !video.isPublished,
    },
    { new: true }
  ).select("title description duration isPublished");
  return res
    .status(201)
    .json(new ApiResponse(201, response, "Updated Publish Status"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
