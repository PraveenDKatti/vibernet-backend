import mongoose from "mongoose";
import { History } from "../models/history.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 1. ADD / UPDATE HISTORY (The "Upsert" logic)
const updateHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const history = await History.findOneAndUpdate(
        { video: videoId, owner: req.user?._id },
        { $set: { lastViewedAt: new Date() } },
        { upsert: true, new: true }
    );

    return res.status(200).json(new ApiResponse(200, history, "History updated"));
});

// 2. GET ALL HISTORY (With Video & Owner details)
const getWatchHistory = asyncHandler(async (req, res) => {
    const history = await History.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(req.user._id) } },
        { $sort: { lastViewedAt: -1 } },
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
                            pipeline: [{ $project: { fullName: 1, username: 1, avatar: 1 } }]
                        }
                    },
                    { $addFields: { owner: { $first: "$owner" } } }
                ]
            }
        },
        { $addFields: { video: { $first: "$video" } } }
    ]);

    return res.status(200).json(new ApiResponse(200, history, "History fetched"));
});

// 3. REMOVE SINGLE ITEM FROM HISTORY
const removeFromHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    await History.findOneAndDelete({ video: videoId, owner: req.user?._id });
    return res.status(200).json(new ApiResponse(200, {}, "Video removed from history"));
});


export {
    updateHistory,
    getWatchHistory,
    removeFromHistory
};