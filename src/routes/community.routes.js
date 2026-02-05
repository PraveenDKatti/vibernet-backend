import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { 
    createPost, 
    getChannelPosts, 
    updatePost, 
    deletePost 
} from "../controllers/community.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").post(upload.single("image"), createPost);
router.route("/user/:userId").get(getChannelPosts);
router.route("/:postId").patch(upload.single("image"), updatePost)
router.route("/:postId").delete(deletePost);

export default router;