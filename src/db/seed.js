import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Community } from "../models/community.model.js";
import dotenv from "dotenv";
import connectDB from "./index.js";

dotenv.config({ path: "./.env" });

const seedData = async () => {
    try {
        await connectDB();

        // 1. Clear existing data
        console.log("Cleaning database...");
        await User.deleteMany({});
        await Video.deleteMany({});
        await Community.deleteMany({});

        // 2. Create Dummy Users
        console.log("Seeding users...");
        const users = [];
        for (let i = 0; i < 10; i++) {
            users.push({
                username: faker.internet.username().toLowerCase(),
                email: faker.internet.email().toLowerCase(),
                fullName: faker.person.fullName(),
                avatar: faker.image.avatar(),
                coverImage: faker.image.urlPicsumPhotos(),
                password: "password123", // In real app, this will be hashed by pre-save hook
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

        // 4. Create Community Posts
        console.log("Seeding community posts...");
        const posts = [];
        for (let i = 0; i < 15; i++) {
            const randomOwner = createdUsers[Math.floor(Math.random() * createdUsers.length)];
            posts.push({
                content: faker.lorem.sentences(2),
                owner: randomOwner._id,
            });
        }
        await Community.insertMany(posts);

        console.log("✅ Database Seeded Successfully!");
        process.exit();
    } catch (error) {
        console.error("❌ Seed Error:", error);
        process.exit(1);
    }
};

seedData();