import { Router } from "express";
import { 
    updateHistory, 
    getWatchHistory, 
    removeFromHistory 
} from "../controllers/history.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Secure all routes
router.use(verifyJWT); 

router.route("/").get(getWatchHistory);
router.route("/:videoId").post(updateHistory)
router.route("/:videoId").delete(removeFromHistory);

export default router;