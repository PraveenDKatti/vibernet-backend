import mongoose, { Schema } from "mongoose";

const historySchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true
    },
    owner: { // The user who watched the video
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // Useful for the "Red Progress Bar" on thumbnails
    lastViewedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// High performance index: find a specific user's history from newest to oldest
historySchema.index({ owner: 1, lastViewedAt: -1 });

export const History = mongoose.model("History", historySchema);