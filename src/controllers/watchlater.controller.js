import mongoose from "mongoose";
import { WatchLater } from "../models/watchlater.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 1. TOGGLE WATCH LATER (Add if missing, Remove if exists)
const addToWatchLater = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId) throw new ApiError("missing video Id")
    const newEntry = await WatchLater.create({ video: videoId, user: req.user?._id });
    return res.status(201).json(new ApiResponse(201, { isAdded: true, data: newEntry }, "Added to Watch Later"));
});

// 2. GET ALL WATCH LATER VIDEOS
const getWatchLaterVideos = asyncHandler(async (req, res) => {
    const list = await WatchLater.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
        { $sort: { createdAt: -1 } },
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

    return res.status(200).json(new ApiResponse(200, list, "Fetched Watch Later feed"));
});

// 3. DELETE SINGLE ITEM (Manual Delete)
const removeFromWatchLater = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId) throw new ApiError("missing video Id")
    await WatchLater.findOneAndDelete({ video: videoId, user: req.user?._id });
    return res.status(200).json(new ApiResponse(200, {}, "Removed from Watch Later"));
});


export {
    addToWatchLater,
    getWatchLaterVideos,
    removeFromWatchLater
};