import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configuring my cloudinary account here.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});
// console.log("Cloudinary Config:", cloudinary.config());

// Configuring cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'MERN1',
        allowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'jfif', 'webp'],
        // public_id: (req, file) => `${Date.now()}-${file.originalname}`, // Add filename processing
    },
});


// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: async (req, file) => {
//         return {
//             folder: "MERN1",
//             format: file.mimetype.split("/")[1], // Automatically get format
//             public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
//         };
//     },
// });

export { cloudinary, storage };