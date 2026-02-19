import mongoose, {Schema} from "mongoose";

const likeSchema = new Schema(
    {
        video: { type: Schema.Types.ObjectId, ref: "Video" },
        comment: { type: Schema.Types.ObjectId, ref: "Comment" },
        post: { type: Schema.Types.ObjectId, ref: "Community" },
        likedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

        // The "Type" field distinguishes between Like and Dislike
        type: {
            type: String,
            enum: ["like", "dislike"],
            required: true
        }
    },
    { timestamps: true }
);

// Updated indexes with sparse property
likeSchema.index({ video: 1, likedBy: 1 }, { unique: true, sparse: true });
likeSchema.index({ comment: 1, likedBy: 1 }, { unique: true, sparse: true });
likeSchema.index({ post: 1, likedBy: 1 }, { unique: true, sparse: true });

export const Like = mongoose.model("Like", likeSchema);