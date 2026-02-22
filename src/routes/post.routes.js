import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    createPost, 
    getChannelPosts, 
    updatePost, 
    deletePost 
} from "../controllers/post.controller.js";

const router = Router();

// Public routes
router.route("/user/:username").get(getChannelPosts);

// Protected routes (require login)
router.use(verifyJWT); 

router.route("/").post(createPost);
router.route("/:postId")
    .patch(updatePost)
    .delete(deletePost);

export default router;