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
            ref: "Community", 
            index: true
        },
        owner: { type: Schema.Types.ObjectId, ref: "User" },

        // stats
        likesCount: { type: Number, default: 0 },
        dislikesCount: { type: Number, default: 0 }
    },
    { timestamps: true }
);

commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema)