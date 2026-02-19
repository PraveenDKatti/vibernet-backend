import { Router } from "express";
import { 
    addComment, 
    deleteComment, 
    getVideoComments, 
    updateComment 
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/v/:videoId").get(getVideoComments)

router.use(verifyJWT)
router.route("/v/:videoId").post(addComment)
router.route("/p/:postId").post(addComment) 

router.route("/c/:commentId")
    .patch(updateComment)
    .delete(deleteComment)

export default router