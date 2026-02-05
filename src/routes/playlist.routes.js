import { Router } from "express";
import { 
    addVideoToPlaylist, 
    createPlaylist, 
    deletePlaylist, 
    getPlaylistById, 
    getUserPlaylists, 
    removeVideoFromPlaylist, 
    updatePlaylist 
} from "../controllers/playlist.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"


const router = Router()
router.use(verifyJWT)

router.route("/").post(createPlaylist)
router.route("/user/:userId").get(getUserPlaylists)
router.route("/:playlistId").get(getPlaylistById)
router.route("/:playlistId/add/:videoId").patch(addVideoToPlaylist)
router.route("/:playlistId/remove/:videoId").patch(removeVideoFromPlaylist)
router.route("/:playlistId").delete(deletePlaylist)
router.route("/update/:playlistId").patch(updatePlaylist)

export default router