import mongoose, { isValidObjectId } from "mongoose";
import { Community } from "../models/community.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const createPost = asyncHandler(async (req, res) => {
    const { content } = req.body;
    
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const imageLocalPath = req.file?.path;
    let image;
    if (imageLocalPath) {
        image = await uploadOnCloudinary(imageLocalPath);
    }

    const post = await Community.create({
        content,
        image: image?.url || "",
        owner: req.user._id
        // likesCount, dislikesCount, commentsCount default to 0 automatically
    });

    return res.status(201).json(new ApiResponse(201, post, "Post created successfully"));
});

const getChannelPosts = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid Channel ID");

    const posts = await Community.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
            // only lookup the specific user's interaction status
            $lookup: {
                from: "likes",
                let: { postId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$post", "$$postId"] },
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
                isLiked: {
                    $cond: {
                        if: { $eq: [{ $first: "$userInteraction.type" }, "like"] },
                        then: true,
                        else: false
                    }
                },
                isDisliked: {
                    $cond: {
                        if: { $eq: [{ $first: "$userInteraction.type" }, "dislike"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: { userInteraction: 0 }
        },
        { $sort: { createdAt: -1 } }
    ]);

    return res.status(200).json(new ApiResponse(200, posts, "Posts fetched successfully"));
});

const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const imageLocalPath = req.file?.path;

    if (!isValidObjectId(postId)) throw new ApiError(400, "Invalid Post Id");

    const post = await Community.findById(postId);
    if (!post) throw new ApiError(404, "Post not found");

    if (post.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized access");
    }

    const updateData = {};
    if (content?.trim()) updateData.content = content;

    if (imageLocalPath) {
        const image = await uploadOnCloudinary(imageLocalPath);
        if (!image) throw new ApiError(500, "Failed to upload image");
        updateData.image = image.url;
    }

    const updatedPost = await Community.findByIdAndUpdate(
        postId,
        { $set: updateData },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedPost, "Post updated"));
});

const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    if (!isValidObjectId(postId)) throw new ApiError(400, "Invalid Post Id");

    const post = await Community.findById(postId);
    if (!post) throw new ApiError(404, "Post not found");

    if (post.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized access");
    }

    await Promise.all([
        Community.findByIdAndDelete(postId),
        Like.deleteMany({ post: postId }),
        Comment.deleteMany({ post: postId })
    ]);

    return res.status(200).json(new ApiResponse(200, {}, "Post and all associated interactions deleted"));
});

export { createPost, getChannelPosts, updatePost, deletePost };