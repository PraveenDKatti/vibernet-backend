import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { Community } from "../models/community.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { videoId, postId } = req.params // Support both video and community posts

    if (!content) throw new ApiError(400, "Comment content is required")

    const commentData = {
        content,
        owner: req.user._id,
    }

    // Determine if commenting on Video or Community Post
    let parentModel;
    let parentId;

    if (videoId) {
        commentData.video = videoId;
        parentModel = Video;
        parentId = videoId;
    } else if (postId) {
        commentData.post = postId;
        parentModel = Community;
        parentId = postId;
    } else {
        throw new ApiError(400, "Video or Post ID is required");
    }

    const comment = await Comment.create(commentData)

    // Update Manual Counter in the parent document
    await parentModel.findByIdAndUpdate(parentId, {
        $inc: { commentsCount: 1 }
    })

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment Id")

    const comment = await Comment.findById(commentId)
    if (!comment) throw new ApiError(404, "Comment not found")

    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Unauthorized access")
    }

    // Capture IDs before deletion
    const videoId = comment.video;
    const postId = comment.post;

    await Comment.findByIdAndDelete(commentId)

    // Decrement the Manual Counter in the correct parent
    if (videoId) {
        await Video.findByIdAndUpdate(videoId, { $inc: { commentsCount: -1 } })
    } else if (postId) {
        await Community.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } })
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"))
})

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video Id")

    const aggregate = Comment.aggregate([
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { username: 1, avatar: 1, fullName: 1 } }]
            }
        },
        {
            // Optional: check if the logged-in user liked each comment
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" },
                // Note: since we have manual counters in schema, we use them
                // but we check isLiked for the current user here
                isLiked: {
                    $in: [req.user?._id, "$likes.likedBy"]
                }
            }
        },
        { $project: { likes: 0 } }
    ])

    const paginatedComments = await Comment.aggregatePaginate(aggregate, { 
        page: Number(page), 
        limit: Number(limit) 
    });

    return res
        .status(200)
        .json(new ApiResponse(200, paginatedComments, "Comments fetched successfully"))
})

// updateComment remains mostly the same, but ensure owner check is robust
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment Id")
    if (!content) throw new ApiError(400, "Content is required")

    const comment = await Comment.findById(commentId)
    if (!comment) throw new ApiError(404, "Comment not found")
    
    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Unauthorized access")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $set: { content } },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}