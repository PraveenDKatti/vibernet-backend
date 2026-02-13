import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { 
    getSubscribedChannels, 
    getUserChannelSubscribers, 
    toggleSubscription,
    getSubscribedFeed 
} from "../controllers/subscription.controller.js";


const router = Router()
router.route("/channel/:channelId").get(getUserChannelSubscribers)
router.use(verifyJWT)

router.route("/feed").get(getSubscribedFeed);
router.route("/channel/:channelId").post(toggleSubscription)
router.route("/:subscriberId").get(getSubscribedChannels)

export default router