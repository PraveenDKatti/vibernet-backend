import { Router } from "express";
import { 
    addComment, 
    deleteComment, 
    getComments, 
    updateComment 
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/v/:videoId").get(getComments);
router.route("/p/:postId").get(getComments);

router.use(verifyJWT)
router.route("/v/:videoId").post(addComment)
router.route("/p/:postId").post(addComment) 

router.route("/c/:commentId")
    .patch(updateComment)
    .delete(deleteComment)

export default router