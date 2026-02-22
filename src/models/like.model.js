import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["like", "dislike"],
      required: true,
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The "Polymorphic" fields
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      // This tells Mongoose to look at 'targetType' to know which model to populate from
      refPath: "targetType", 
    },
    targetType: {
      type: String,
      required: true,
      lowercase: true,
      enum: ["video", "comment", "post"], // Strict list of what can be liked
    },
  },
  { timestamps: true }
);

// THE POWER OF THIS SCHEMA:
// One single compound index handles EVERYTHING.
// It ensures a user can only have ONE reaction (like or dislike) per item.
likeSchema.index({ likedBy: 1, targetId: 1 }, { unique: true });

export const Like = mongoose.model("Like", likeSchema);