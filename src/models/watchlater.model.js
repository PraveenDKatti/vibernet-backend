import mongoose, { Schema } from "mongoose";

const watchLaterSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// Ensure a user can't add the same video to "Watch Later" twice
watchLaterSchema.index({ video: 1, user: 1 }, { unique: true });

export const WatchLater = mongoose.model("WatchLater", watchLaterSchema);