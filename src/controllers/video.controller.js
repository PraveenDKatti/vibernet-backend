import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination

    const pipeline = []

    //convert strings into Number
    const pageNumber = Number(page)
    const limitNumber = Number(limit)

    //construct search query
    if(query){
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        })
    }

    //filter based on user
    if(userId){
        pipeline.push({ $match: { owner: new mongoose.Types.ObjectId(userId) } });
    }

    // Sort logic
    if (sortBy && sortType) {
        pipeline.push({
            $sort: { [sortBy]: sortType === "asc" ? 1 : -1 }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Fetch owner details
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [{ $project: { username: 1, avatar: 1, fullName: 1 } }]
        }
    }, { $addFields: { owner: { $first: "$owner" } } });

    const aggregate = Video.aggregate(pipeline);
    
    // pagination
    const options = { page: pageNumber, limit: limitNumber };
    const videos = await Video.aggregatePaginate(aggregate, options);

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "fetched all videos successfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video

    const { title, description } = req.body

    if ([title, description].some(field => field.trim() === "")) {
        throw new ApiError(401, "all fields required")
    }

    const videoPath = req.files?.videoFile[0]?.path
    const thumbnailPath = req.files?.thumbnail[0]?.path

    if (!videoPath) throw new ApiError(400, "Video is required")
    if (!thumbnailPath) throw new ApiError(400, "Thumbnail is required")

    const cloudVideoFile = await uploadOnCloudinary(videoPath, { resource_type:"video"})
    const cloudThumbnail = await uploadOnCloudinary(thumbnailPath, {resource_type: "image"})

    if(!cloudVideoFile){
        throw new ApiError(500, "something went wrong while uploading video")
    }

    const video = await Video.create({
        videoFile: cloudVideoFile.url,
        title,
        description,
        duration: cloudVideoFile.duration,
        thumbnail:cloudThumbnail.url,
        owner:req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200,video,"video published successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id]]
    const {videoId} = req.params

    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")

    const video = await Video.aggregate([
        { $match: {_id: new mongoose.Types.ObjectId(videoId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[ { $project: { username: 1, avatar: 1, fullname: 1 } } ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields:{
                likesCount: {$size: "$likes"},
                owner: {$first: "$owner"},
                isLiked: { $in: [req.user?._id, "$likes.likedBy"]}
            }
        }
    ])

    if(!video.length) throw new ApiError(404, "video not found")

    return res
    .status(200)
    .json(new ApiResponse(200,video[0],"video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnailPath = req.file?.path;

    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID");

    const video = await Video.findById(videoId)
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this video");
    }
                
    const updateData = { title, description };
    
    if(thumbnailPath){
        newThumbnail = await uploadOnCloudinary(thumbnailPath)
        if(!newThumbnail.url){
            throw new ApiError(500,"Something went wrong while uploading thumbnail")
        }
        updateData.thumbnail = newThumbnail.url
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true }
    )

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    //TODO: delete video
    const { videoId } = req.params

    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video Id")
    
    const video = await Video.findById(videoId)
    if(video.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Unauthorized access")
    }

    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "deleted video successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video Id")

    const video = await Video.findById(videoId)
    if(video.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Unauthorized access")
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json(new ApiResponse(200, {isPublished: video.isPublished }, "toggled publish status Successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
