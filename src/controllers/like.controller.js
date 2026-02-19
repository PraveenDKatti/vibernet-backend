import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Community } from "../models/community.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleReaction = asyncHandler(async (req, res) => {
    const { targetId } = req.params;
    const { type } = req.query; // "like" or "dislike"
    const userId = req.user._id;

    if (!isValidObjectId(targetId)) throw new ApiError(400, "Invalid ID");
    if (!["like", "dislike"].includes(type)) throw new ApiError(400, "Invalid reaction type");

    // 1. Identify the Target Model (Video, Comment, or Post)
    // Professional Tip: We check which field is present in the Like Schema
    let TargetModel;
    let targetField;

    // Check Video
    const isVideo = await Video.exists({ _id: targetId });
    if (isVideo) {
        TargetModel = Video;
        targetField = "video";
    } else {
        const isComment = await Comment.exists({ _id: targetId });
        if (isComment) {
            TargetModel = Comment;
            targetField = "comment";
        } else {
            const isPost = await Community.exists({ _id: targetId });
            if (isPost) {
                TargetModel = Community;
                targetField = "post";
            }
        }
    }

    if (!TargetModel) throw new ApiError(404, "Target not found");

    // 2. Check if reaction already exists
    const existingReaction = await Like.findOne({ 
        likedBy: userId, 
        [targetField]: targetId 
    });

    // --- CASE 1: Removing the same reaction (Toggling OFF) ---
    if (existingReaction && existingReaction.type === type) {
        await Like.findByIdAndDelete(existingReaction._id);
        
        const counterField = type === "like" ? "likesCount" : "dislikesCount";
        await TargetModel.findByIdAndUpdate(targetId, { $inc: { [counterField]: -1 } });

        return res.status(200).json(new ApiResponse(200, { status: null }, "Reaction removed"));
    }

    // --- CASE 2: Switching reaction (Like to Dislike or vice-versa) ---
    if (existingReaction && existingReaction.type !== type) {
        existingReaction.type = type;
        await existingReaction.save();

        const decField = type === "like" ? "dislikesCount" : "likesCount";
        const incField = type === "like" ? "likesCount" : "dislikesCount";

        await TargetModel.findByIdAndUpdate(targetId, { 
            $inc: { [decField]: -1, [incField]: 1 } 
        });

        return res.status(200).json(new ApiResponse(200, { status: type }, `Switched to ${type}`));
    }

    // --- CASE 3: New Reaction (Toggling ON) ---
    await Like.create({
        likedBy: userId,
        [targetField]: targetId,
        type
    });

    const incField = type === "like" ? "likesCount" : "dislikesCount";
    await TargetModel.findByIdAndUpdate(targetId, { $inc: { [incField]: 1 } });

    return res.status(200).json(new ApiResponse(200, { status: type }, `Added ${type}`));
});


const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        { 
            $match: { 
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true },
                type: "like"
            } 
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [{ $project: { username: 1, avatar: 1, fullName: 1 } }]
                        }
                    },
                    { $addFields: { owner: { $first: "$owner" } } }
                ]
            }
        },
        { $unwind: "$video" },
        { $replaceRoot: { newRoot: "$video" } }
    ]);

    return res.status(200).json(new ApiResponse(200, likedVideos, "Fetched liked videos"));
});

export {
    toggleReaction,
    getLikedVideos
}