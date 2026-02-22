import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Post } from "../models/post.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleReaction = asyncHandler(async (req, res) => {
    const { targetId } = req.params;
    const { type, targetType } = req.query; // targetType: "video", "comment", or "post"
    const userId = req.user._id;

    // 1. Find if a reaction already exists
    const existingReaction = await Like.findOne({
        likedBy: userId,
        targetId: targetId
    });

    // 2. Identify which model to update manual counters for
    const models = { video: Video, comment: Comment, post: Post };
    const TargetModel = models[targetType];

    if (!TargetModel) throw new ApiError(400, "Invalid target type");

    if (existingReaction) {
        if (existingReaction.type === type) {
            // UNDO: Delete reaction and decrement counter
            await Like.findByIdAndDelete(existingReaction._id);
            await TargetModel.findByIdAndUpdate(targetId, {
                $inc: { [type === "like" ? "likesCount" : "dislikesCount"]: -1 }
            });
            return res.status(200).json(new ApiResponse(200, { status: null }, "Removed"));
        } else {
            // SWITCH: Update type and swap counters
            const oldType = existingReaction.type;
            existingReaction.type = type;
            await existingReaction.save();

            await TargetModel.findByIdAndUpdate(targetId, {
                $inc: {
                    [type === "like" ? "likesCount" : "dislikesCount"]: 1,
                    [oldType === "like" ? "likesCount" : "dislikesCount"]: -1
                }
            });
            return res.status(200).json(new ApiResponse(200, { status: type }, "Switched"));
        }
    }

    // NEW: Create reaction and increment counter
    await Like.create({ likedBy: userId, targetId, targetType, type });
    await TargetModel.findByIdAndUpdate(targetId, {
        $inc: { [type === "like" ? "likesCount" : "dislikesCount"]: 1 }
    });

    return res.status(200).json(new ApiResponse(200, { status: type }, "Success"));
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
})

export {
    toggleReaction,
    getLikedVideos
}