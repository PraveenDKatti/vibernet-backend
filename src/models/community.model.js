import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const communitySchema = new Schema(
    {
        content: { type: String, required: true },
        image: { type: String },
        owner: { type: Schema.Types.ObjectId, ref: "User" },

        // stats
        likesCount: { type: Number, default: 0 },
        dislikesCount: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 }
    }, 
    { timestamps: true }
);

communitySchema.index({ content: "text" });
communitySchema.plugin(mongooseAggregatePaginate);
export const Community = mongoose.model("Community", communitySchema);