import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { 
    getLikedVideos, 
    toggleReaction // The universal controller
} from "../controllers/like.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/toggle/:targetId").post(toggleReaction)
router.route("/videos").get(getLikedVideos)

export default router