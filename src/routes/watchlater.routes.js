import { Router } from "express";
import { 
    AddToWatchLater, 
    getWatchLaterVideos, 
    RemoveFromWatchLater 
} from "../controllers/watchlater.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT); 

router.route("/")
    .get(getWatchLaterVideos); // GET: /api/v1/watch-later

router.route("/:videoId")
    .post(AddToWatchLater)     // POST: /api/v1/watch-later/64f1... (Add)
    .delete(RemoveFromWatchLater); // DELETE: /api/v1/watch-later/64f1... (Remove)

export default router;