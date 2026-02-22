import mongoose, { isValidObjectId } from "mongoose";
import { Post } from "../models/post.model.js";
import { Comment } from '../models/comment.model.js'
import { Like } from '../models/like.model.js'
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createPost = asyncHandler(async (req, res) => {
    const { content, type, poll, videoId } = req.body;
    const ownerId = req.user?._id;

    // 1. Basic validation
    if (!type || !["text", "image", "video", "poll"].includes(type)) {
        throw new ApiError(400, "Valid post type is required");
    }

    const postData = {
        content,
        type,
        owner: ownerId,
    };

    // 2. Handle specific types
    if (type === "poll") {
        if (!poll || !poll.question || !poll.options || poll.options.length < 2) {
            throw new ApiError(400, "Polls require a question and at least 2 options");
        }
        // Map options to match schema [{ text: "Option 1" }, { text: "Option 2" }]
        postData.poll = {
            question: poll.question,
            options: poll.options.map(optionText => ({ text: optionText })),
            expiresAt: poll.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
        };
    }

    if (type === "video") {
        if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video reference");
        postData.video = videoId;
    }

    // Note: 'images' would typically come from req.files (Multer/Cloudinary)
    if (type === "image") {
        const imageFiles = req.files?.images?.map(file => file.path);
        if (!imageFiles || imageFiles.length === 0) {
            throw new ApiError(400, "Images are required for an image post");
        }
        postData.images = imageFiles;
    }

    // 3. Create and return
    const post = await Post.create(postData);

    if (!post) {
        throw new ApiError(500, "Something went wrong while creating the post");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, post, "Post created successfully"));
});


const getChannelPosts = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid User Id");

    const posts = await Post.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: "likes",
                let: { postId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$targetId", "$$postId"] },
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
                // Mapping your Schema's manual fields to the response
                totalLikes: "$likesCount",
                totalDislikes: "$dislikesCount",
                totalComments: "$commentsCount", 
                isLiked: { $eq: [{ $first: "$userInteraction.type" }, "like"] },
                isDisliked: { $eq: [{ $first: "$userInteraction.type" }, "dislike"] }
            }
        },
        { $project: { userInteraction: 0 } },
        { $sort: { createdAt: -1 } }
    ]);

    return res.status(200).json(new ApiResponse(200, posts, "Posts fetched successfully"));
});


const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content, poll } = req.body;

    if (!isValidObjectId(postId)) throw new ApiError(400, "Invalid Post ID");

    const post = await Post.findById(postId);

    if (!post) throw new ApiError(404, "Post not found");

    // Check if the requester is the owner
    if (post.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to update this post");
    }

    // Update content if provided
    if (content) post.content = content;

    // Update poll if applicable
    if (post.type === "poll" && poll) {
        if (poll.question) post.poll.question = poll.question;
        if (poll.expiresAt) post.poll.expiresAt = poll.expiresAt;
        // Note: Updating poll options after votes have started is risky, 
        // usually, you only allow updating the question or expiry.
    }

    await post.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, post, "Post updated successfully"));
});


const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) throw new ApiError(400, "Invalid Post ID");

    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, "Post not found");

    if (post.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this post");
    }

    const comments = await Comment.find({ post: postId }).select("_id");
    const commentIds = comments.map(c => c._id);

    await Post.findByIdAndDelete(postId);

    await Promise.all([
        Post.findByIdAndDelete(postId), // Delete the Post
        Comment.deleteMany({ post: postId }), // Delete all Comments of the post
        Like.deleteMany({ targetId: postId, targetType: "post" }), // Delete Post Likes
        Like.deleteMany({ targetId: { $in: commentIds }, targetType: "comment" }) // Delete Comment Likes
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Post deleted successfully"));
});


export {
    createPost,
    getChannelPosts,
    updatePost,
    deletePost
};