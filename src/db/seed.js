import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";
import connectDB from "./index.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Post } from "../models/post.model.js";
import bcrypt from "bcrypt";

dotenv.config({ path: "./.env" });

const seedData = async () => {
  try {
    await connectDB();
    console.log("DB Connected");

    // 1. Clear existing data
    console.log("Cleaning database...");
    await User.deleteMany({});
    await Video.deleteMany({});
    await Post.deleteMany({});

    // 2. Create Dummy Users
    console.log("Seeding users...");
    const users = [];
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    for (let i = 0; i < 10; i++) {
      users.push({
        username: faker.internet.username().toLowerCase(),
        email: faker.internet.email().toLowerCase(),
        fullName: faker.person.fullName(),
        avatar: faker.image.avatar(),
        coverImage: faker.image.urlPicsumPhotos(),
        password: hashedPassword, // pre-save hook may hash
      });
    }
    const createdUsers = await User.insertMany(users);

    // 3. Create Dummy Videos
    console.log("Seeding videos...");
    const videos = [];
    for (let i = 0; i < 20; i++) {
      const randomOwner = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      videos.push({
        videoFile: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
        thumbnail: faker.image.url({ width: 640, height: 480 }),
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        duration: faker.number.int({ min: 60, max: 600 }),
        views: faker.number.int({ min: 0, max: 10000 }),
        isPublished: true,
        owner: randomOwner._id,
      });
    }
    await Video.insertMany(videos);

    // 4. Create Mixed Posts (text, video, image, poll)
    console.log("Seeding posts...");
    const posts = [];
    for (let i = 0; i < 20; i++) {
      const randomOwner = createdUsers[Math.floor(Math.random() * createdUsers.length)];

      // Random type
      const types = ["text", "video", "image", "poll"];
      const type = types[Math.floor(Math.random() * types.length)];

      const post = {
        content: faker.lorem.sentences(2),
        type,
        owner: randomOwner._id,
      };

      // If video type
      if (type === "video") {
        const randomVideo = videos[Math.floor(Math.random() * videos.length)];
        post.video = randomVideo._id;
      }

      // If image type
      if (type === "image") {
        post.images = [
          faker.image.url({ width: 640, height: 480 }),
          faker.image.url({ width: 640, height: 480 }),
        ];
      }

      // If poll type
      if (type === "poll") {
        post.poll = {
          question: faker.lorem.sentence(),
          options: [
            { text: faker.lorem.words(2) },
            { text: faker.lorem.words(2) },
            { text: faker.lorem.words(2) },
          ],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          totalVotes: 0,
        };
      }

      posts.push(post);
    }

    await Post.insertMany(posts);

    console.log("✅ Database Seeded Successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Seed Error:", error);
    process.exit(1);
  }
};

seedData();