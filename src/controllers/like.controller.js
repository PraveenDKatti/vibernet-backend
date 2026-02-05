import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video Id")

    const like = await Like.findOne({ likedBy: req.user._id, video: new mongoose.Types.ObjectId(videoId)})

    if(like){
        await Like.findByIdAndDelete(like._id)
        return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: false }, "toggled like successfully"))
    }
    
    await Like.create( { likedBy: req.user._id, video: videoId })
    return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: true }, "toggled like Successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment Id")

    const like = await Like.findOne( { likedBy: req.user.id, comment: new mongoose.Types.ObjectId(commentId)} )

    if(like){
        await Like.findByIdAndDelete(like._id)
        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: false}, "toggled like successfully"))
    }

    await Like.create({ likedBy: req.user._id, comment: new mongoose.Types.ObjectId(commentId)})
    return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: true }, "toggled like successfully"))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        { $match: { likedBy: new mongoose.Types.ObjectId(req.user._id) } },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[ { $project:{ username: 1, avatar: 1 } } ]
                        }
                    },
                    {
                        $addFields: { owner: { $first: "$owner" } }
                    }
                ]
            }
        },
        { $unwind: "$video" },
        { $replaceRoot: { newRoot: "$video"} }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "fetched liked videos successfully"))
})

export {
    toggleCommentLike,
    toggleVideoLike,
    getLikedVideos
}