import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    createPost, 
    getChannelPosts, 
    updatePost, 
    deletePost 
} from "../controllers/post.controller.js";
import {upload} from '../middlewares/multer.middleware.js'

const router = Router();

// Public routes
router.route("/:username").get(getChannelPosts);

// Protected routes (require login)
router.use(verifyJWT); 

router.route("/").post(upload.fields([ { name:"images",maxCount:4 }]), createPost);
router.route("/:postId")
    .patch(updatePost)
    .delete(deletePost);

export default router;