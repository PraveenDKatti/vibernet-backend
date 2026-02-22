import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { 
    getSubscribedChannels, 
    getSubscribersCount, 
    toggleSubscription,
    getSubscribedFeed 
} from "../controllers/subscription.controller.js";


const router = Router()
router.route("/:username").get(getSubscribersCount)
router.use(verifyJWT)

router.route("/profile/subscriptions").get(getSubscribedFeed);
router.route("/:username").post(toggleSubscription)
router.route("/profile/channels").get(getSubscribedChannels)

export default router