import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'

import dotenv from 'dotenv'; // 1. Import dotenv

dotenv.config(); // 2. Initialize it immediately

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temp file as opration got failed.     
    }
}

const uploadMultipleOnCloudinary = async (localFilePaths = []) => {
    try {
        if (!localFilePaths || localFilePaths.length === 0) return [];

        const uploadPromises = localFilePaths.map(filePath =>
            cloudinary.uploader.upload(filePath, {
                resource_type: "auto"
            })
        );

        const responses = await Promise.all(uploadPromises);

        // delete local files after successful upload
        localFilePaths.forEach(path => {
            if (fs.existsSync(path)) {
                fs.unlinkSync(path);
            }
        });

        return responses;

    } catch (error) {
        // cleanup if something fails
        localFilePaths.forEach(path => {
            if (fs.existsSync(path)) {
                fs.unlinkSync(path);
            }
        });

        throw error;
    }
};

export { uploadOnCloudinary, uploadMultipleOnCloudinary }