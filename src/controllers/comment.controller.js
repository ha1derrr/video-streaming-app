import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page);
  const pageLimit = parseInt(limit);
  const options = {
    page: pageNumber,
    limit: pageLimit,
  };
  const aggregate = Comment.aggregate([
    {
      $match: { video: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $project: {
              title: 1,
              duration: 1,
              videoFile: 1,
              description: 1,
            },
          },
        ],
      },
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
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: { $first: "$video" },
        owner: { $first: "$owner" },
      },
    },
    {
      $project: {
        content: 1,
        video: 1,
        owner: 1,
      },
    },
  ]);
  const result = await Comment.aggregatePaginate(aggregate, options);

  if (!result?.docs?.length) throw new Error("No comments");
  return res.status(200).json(result.docs);
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { content } = req.body;
  const { videoId } = req.params;
  if (!content?.trim() || !content?.trim())
    throw new ApiError(404, "Content is required");
  const comment = await Comment.create({
    content,
    owner: req.user?._id,
    video: videoId,
  });
  if (!comment) throw new ApiError(500, "Could not add comment");
  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { content } = req.body;
  const { commentId } = req.params;
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content,
    },
    {
      new: true,
    }
  ).select("content -_id");
  if (!updatedComment) throw new ApiError(500, "Internal Server Error, My Bad");
  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment Updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  const result = await Comment.findByIdAndDelete(commentId);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comment Deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
