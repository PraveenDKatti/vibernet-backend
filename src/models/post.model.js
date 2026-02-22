import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

/* ---------------- POLL OPTION ---------------- */

const pollOptionSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    votesCount: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

/* ---------------- POST SCHEMA ---------------- */

const postSchema = new Schema(
  {
    content: {
      type: String,
      trim: true
    },

    type: {
      type: String,
      enum: ["text", "image", "video", "poll"],
      required: true,
      index: true
    },

    images: [String],

    video: {
      type: Schema.Types.ObjectId,
      ref: "Video"
    },

    poll: {
      question: {
        type: String,
        trim: true
      },
      options: [pollOptionSchema],
      expiresAt: Date,
      totalVotes: {
        type: Number,
        default: 0,
      }
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

/* ---------------- POLL VALIDATION ONLY ---------------- */

postSchema.pre("validate", function (next) {
  if (this.type === "poll") {
    if (!this.poll?.question) {
      return next(new Error("Poll must contain a question"));
    }

    if (!this.poll.options || this.poll.options.length < 2) {
      return next(new Error("Poll must have at least 2 options"));
    }
  }

  next();
});

postSchema.index({ type: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.plugin(mongooseAggregatePaginate);

export const Post = mongoose.model("Post", postSchema);