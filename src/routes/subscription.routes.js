import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { 
    getSubscribedChannels, 
    getSubscribersCount, 
    toggleSubscription,
    getSubscribedFeed 
} from "../controllers/subscription.controller.js";


const router = Router()

router.route("/feed").get(verifyJWT, getSubscribedFeed);
router.route("/profile/channels").get(verifyJWT, getSubscribedChannels);
router.route("/:username").get(getSubscribersCount)
router.route("/:username").post(verifyJWT, toggleSubscription)

export default router