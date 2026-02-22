import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content: { type: String, required: true },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            index: true
        },
        post: {
            type: Schema.Types.ObjectId,
            ref: "Post",
            index: true
        },
        owner: { type: Schema.Types.ObjectId, ref: "User" },
        // For Replies
        parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },

        likesCount: { type: Number, default: 0 },
        dislikesCount: { type: Number, default: 0 },
        repliesCount: { type: Number, default: 0 } // <--- Use Number, not ObjectId
    },
    { timestamps: true }
);

commentSchema.index({ video: 1, createdAt: -1 });
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema)