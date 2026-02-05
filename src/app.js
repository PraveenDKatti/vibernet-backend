import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from "./routes/comment.routes.js";
import subscriptionRoute from "./routes/subscription.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import communityRouter from "./routes/community.routes.js"
import likeRouter from "./routes/like.routes.js"
import dashboardRouter from "./routes/like.routes.js"
import healthcheckRouter from "./routes/like.routes.js"

//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/subscriptions", subscriptionRoute)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/community", communityRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)

//global error handler
app.use(errorHandler);

export { app }