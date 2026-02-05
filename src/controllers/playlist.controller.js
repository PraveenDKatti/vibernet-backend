import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    //TODO: create playlist
    if (!(name || !description)) throw new ApiError(401, "all fields required")

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
        videos: []
    })

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists
    const { userId } = req.params
    if(!isValidObjectId(userId)) throw new ApiError(400, "Invalid User Id")

    const playlists = await Playlist.find({owner: userId})
    if (!playlists) throw new ApiError(404, "No playlist found") 

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "playlist fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id
    const { playlistId } = req.params
    if(!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid Playlist Id")
    
    const playlist = await Playlist.findById(playlistId)

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "playlist fetched successfully"))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if(!isValidObjectId(playlistId) && !isValidObjectId(videoId)) throw new ApiError(400, "Invalid playlist or video id") 

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: {videos: videoId} },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "video added to playlist"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId) && !isValidObjectId(videoId)) throw new ApiError(400, "Invalid playlist or video id") 
    
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { video: videoId } },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "removed video from playlist"))


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist Id")
    await Playlist.findByIdAndDelete(playlistId)

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist Id")

    const playlist = await Playlist.findById(playlistId)
    if(!playlist) throw new ApiError(404, "Playlist Not Found")

    if (name) { playlist.name = name }
    if (description) { playlist.description = description }
    await playlist.save()

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "updated playlist successfully."))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
