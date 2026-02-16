import { Router } from "express";
import { 
    toggleWatchLater, 
    getWatchLaterVideos, 
    deleteFromWatchLater 
} from "../controllers/watchlater.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT); 

router.route("/")
    .get(getWatchLaterVideos); // GET: /api/v1/watch-later

router.route("/:videoId")
    .post(toggleWatchLater)     // POST: /api/v1/watch-later/64f1... (Add/Remove)
    .delete(deleteFromWatchLater); // DELETE: /api/v1/watch-later/64f1... (Hard Delete)

export default router;