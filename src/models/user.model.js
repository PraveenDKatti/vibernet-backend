import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new Schema(
  {
    username: { 
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    email: { // Private login email
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      select: false // Automatically excludes from "Find" queries for security
    },

    contactEmail: { // Public business email
      type: String,
      lowercase: true,
      trim: true,
      default: ""
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    avatar: {
      type: String,
      required: true
    },

    coverImage: {
      type: String
    },

    links: [
      {
        title: { type: String, trim: true },
        url: { type: String, trim: true }
      }
    ],

    password: {
      type: String,
      required: [true, "Password is required"]
    },

    refreshToken: {
      type: String
    }
  },
  { 
    timestamps: true 
  }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return

    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

userSchema.index({ 
    username: "text", 
    fullName: "text" 
})


export const User = mongoose.model("User", userSchema)
