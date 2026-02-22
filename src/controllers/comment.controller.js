import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { Post } from "../models/post.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const addComment = asyncHandler(async (req, res) => {
    const { content, parentCommentId } = req.body; // parentCommentId for replies
    const { videoId, postId } = req.params;

    if (!content?.trim()) throw new ApiError(400, "Comment content is required");

    const commentData = {
        content,
        owner: req.user._id,
    };

    let ParentModel;
    let parentId;

    // 1. Identify where this comment belongs (Video or Post)
    if (videoId) {
        if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID");
        commentData.video = videoId;
        ParentModel = Video;
        parentId = videoId;
    } else if (postId) {
        if (!isValidObjectId(postId)) throw new ApiError(400, "Invalid Post ID");
        commentData.post = postId;
        ParentModel = Post; // Matches your export const Post
        parentId = postId;
    } else {
        throw new ApiError(400, "Video or Post ID is required");
    }

    // 2. Handle Replies (if it's a nested comment)
    if (parentCommentId) {
        if (!isValidObjectId(parentCommentId)) throw new ApiError(400, "Invalid Parent Comment ID");
        commentData.parentComment = parentCommentId;
    }

    // 3. Create the comment
    const comment = await Comment.create(commentData);

    // 4. Update the Manual Counters (Atomic Operations)
    const updateTasks = [];

    // Increment commentsCount on the Video or Post
    updateTasks.push(
        ParentModel.findByIdAndUpdate(parentId, { $inc: { commentsCount: 1 } })
    );

    // If it's a reply, increment repliesCount on the parent comment
    if (parentCommentId) {
        updateTasks.push(
            Comment.findByIdAndUpdate(parentCommentId, { $inc: { repliesCount: 1 } })
        );
    }

    // Run updates in parallel for better performance
    await Promise.all(updateTasks);

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"));
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
        await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } })
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"))
})


const getComments = asyncHandler(async (req, res) => {
    // 1. Get IDs from params and query
    const { videoId, postId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // 2. Determine the filter based on what was provided in the URL
    const filter = {};
    if (videoId) {
        if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID");
        filter.video = new mongoose.Types.ObjectId(videoId);
    } else if (postId) {
        if (!isValidObjectId(postId)) throw new ApiError(400, "Invalid Post ID");
        filter.post = new mongoose.Types.ObjectId(postId);
    } else {
        throw new ApiError(400, "Target ID (Video or Post) is required");
    }

    // 3. IMPORTANT: Only fetch top-level comments (not replies) by default
    filter.parentComment = null;

    const aggregate = Comment.aggregate([
        { $match: filter },
        // Join with User (Comment Author)
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "author",
                pipeline: [{ $project: { username: 1, avatar: 1, fullName: 1 } }]
            }
        },
        // Join with Likes to check current user's status (isLiked/isDisliked)
        {
            $lookup: {
                from: "likes",
                let: { commentId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$targetId", "$$commentId"] },
                                    { $eq: ["$likedBy", new mongoose.Types.ObjectId(req.user?._id)] }
                                ]
                            }
                        }
                    }
                ],
                as: "userInteraction"
            }
        },
        {
            $addFields: {
                author: { $first: "$author" },
                // Use the Manual Counters from your Schema!
                likes: "$likesCount",
                dislikes: "$dislikesCount",
                replies: "$repliesCount", 
                isLiked: { $eq: [{ $first: "$userInteraction.type" }, "like"] },
                isDisliked: { $eq: [{ $first: "$userInteraction.type" }, "dislike"] }
            }
        },
        { $project: { userInteraction: 0 } },
        { $sort: { createdAt: -1 } }
    ]);

    const result = await Comment.aggregatePaginate(aggregate, { 
        page: Number(page), 
        limit: Number(limit) 
    });

    return res.status(200).json(new ApiResponse(200, result, "Comments fetched successfully"));
});


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
    getComments,
    addComment,
    updateComment,
    deleteComment
}