import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    if (!isValidObjectId(channelId)) throw new ApiError(400, "invalid channel id")

    const subscription = await Subscription.findOne({ subscriber: req.user.id, channel: new mongoose.Types.ObjectId(channelId)})

    if (subscription) {
        await Subscription.findByIdAndDelete(subscription._id)        
        return res
        .status(200)
        .json(200, { subscribed: false}, "subscription toggled successfully")
    }

    await Subscription.create({ subscriber: req.user.id, channel: new mongoose.Types.ObjectId(channelId) })

    return res
        .status(200)
        .json(200, { subscribed: true }, "subscription toggled successfully")
})

// controller to return subscriber list of a channel
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
                pipeline: [ { $project: { username: 1, fullName: 1, avatar: 1} } ]
            }
        },
        { $unwind:"$subscriber" },
        { $project: { subscriber: 1, createdAt: 1 } }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, channelSubscribers, "subscribers fetched successfully."))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) throw new ApiError(400, "invalid subscriber id")

    const subscribedChannels = await Subscription.aggregate([
        { $match:{ subscriber: new mongoose.Types.ObjectId(subscriberId) } },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline:[{ $project:{ username: 1, fullName:1, avatar: 1} } ]
            }
        },
        { $unwind: "$subscribedChannel" },
        { $project: { subscribedChannel:1, createdAt: 1 } }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, subscribedChannels, "fetched user subscribed channels successfully"))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}