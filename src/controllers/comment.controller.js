import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video

    const { videoId } = req.params
    const { page=1, limit=10 } = req.query

    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video Id")

    const comments = Comment.aggregate([
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [ { $project: {username: 1, avatar: 1} } ]
            }
        },
        { $addFields: { owner: { $first: "$owner" } } }
    ])

    const paginatedComments = await Comment.aggregatePaginate(comments, { page: Number(page), limit: Number(limit) });

    return res
    .status(200)
    .json(new ApiResponse(200, paginatedComments, "comments fetched successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body
    const { videoId } = req.params

    if(!content) throw new ApiError(404, "comment content is required")

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id,
    })

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body

    if(!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment Id")
    if(!content) throw new ApiError(404, "content is required")

    const comment = await Comment.findById(commentId)
    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Unauthorized access")
    }

    const updaedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $set: {content } },
        { new: true }
    )

    return res
    .status(200)
    .json(new ApiResponse(200, updaedComment, "comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const { commentId } = req.params
    if(!isValidObjectId(commentId)) throw new ApiError("Invalid comment Id")

    const comment = await Comment.findById(commentId)
    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Unauthorized access")
    }

    await Comment.findByIdAndDelete(commentId)
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "comment deleted Successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}
