import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) throw new ApiError(400, "invalid channel id")

    // Use _id for consistency
    const subscription = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })

    if (subscription) {
        await Subscription.findByIdAndDelete(subscription._id)
        return res
            .status(200)
            .json(new ApiResponse(200, { subscribed: false }, "subscription removed"))
    }

    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { subscribed: true }, "subscription added"))
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!isValidObjectId(channelId)) throw new ApiError(400, "invalid channel id")

    const channelSubscribers = await Subscription.aggregate([
        { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }]
            }
        },
        { $unwind: "$subscriber" },
        { $project: { subscriber: 1, createdAt: 1 } }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, channelSubscribers, "subscribers fetched successfully."))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) throw new ApiError(400, "invalid subscriber id")

    const subscribedChannels = await Subscription.aggregate([
        { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
                pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }]
            }
        },
        { $unwind: "$channelDetails" },

        // 3. LOOKUP: Count how many people follow THIS specific channel
        {
            $lookup: {
                from: "subscriptions",
                localField: "channel", // The ID of the channel we are looking at
                foreignField: "channel", // Look for this ID in the 'channel' field of other subscription docs
                as: "allSubscribers"
            }
        },
        {
            $addFields: {
                subscriberCount: { $size: { $subcribers } }
            }
        },
        {
            $project: {
                channelDetails: 1,
                subscriberCount: 1,
                createdAt: 1
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, subscribedChannels, "fetched user subscribed channels successfully"))
})

const getSubscribedFeed = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const aggregate = Subscription.aggregate([
        { $match: { subscriber: new mongoose.Types.ObjectId(req.user?._id) } },
        {
            $lookup: {
                from: "videos",
                localField: "channel",
                foreignField: "owner",
                as: "videos",
                pipeline: [{ $match: { isPublished: true } }],
            }
        },
        { $unwind: "$videos" },
        { $replaceRoot: { newRoot: "$video" } },
        {
            $lookup:{
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'ownerDetails',
                pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }]
            }
        },
        { $unwind: "$ownerDetails" },
        { $sort: { createdAt: -1 } }
    ]);

    // Using the aggregatePaginate plugin correctly here
    const feed = await Video.aggregatePaginate(aggregate, { page, limit });

    return res.status(200).json(new ApiResponse(200, feed, "Feed fetched successfully"));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    getSubscribedFeed
}