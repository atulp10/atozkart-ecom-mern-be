import express from "express";
import { catchAsync } from "../utils/catchAsync.js";
import Product from "../model/productModel.js";
import { isAuthorized, isLoggedIn } from "../middlewares.js";
import { uploadImages } from "../utils/uploadImages.js";
import multer from "multer";
// Multer is a node.js middleware for handling multipart/form-data, 
// which is primarily used for uploading files.
// NOTE: Multer will not process any form which is not multipart 
// enctype='multipart/form-data'.
import { storage } from "../cloudinary/cloudinaryIndex.js";

const upload = multer({ storage:storage });
// uploaded files are stored in the place defined in 'storage'.
const router = express.Router();

router.get('/', catchAsync(async (req, res, next) => {
    console.log(req.user);
    console.log(req.isAuthenticated());
    console.log('req.cookies::::', req.cookies);
    console.log('req.session:::', req.session);
    const products = await Product.find({});
    return res.status(200).json(products);
}))

// router.post('/images',upload.array('images'),async (req,res,next)=>{
//     try {
//         console.log('req.body: ', req.body);  // Additional form data
//         console.log('req.files: ', req.files); // Cloudinary response should be here

//         if (!req.files || req.files.length === 0) {
//             return res.status(400).json({ message: 'No files uploaded' });
//         }

//         // Cloudinary stores file details inside req.files
//         const uploadedFiles = req.files.map(file => ({
//             url: file.path, // Cloudinary URL
//             filename: file.filename // Cloudinary filename
//         }));

//         res.status(200).json({
//             message: 'Images uploaded successfully',
//             files: uploadedFiles
//         });

//     } catch (error) {
//         console.error('Error uploading images:', error);
//         res.status(500).json({ message: 'Upload failed', error });
//     }
// })

router.post('/images', (req, res, next) => {
    console.log("✅ Route /images hit!"); // This should print immediately
    next();
}, upload.array('images'), async (req, res, next) => {
    console.log("✅ Inside Multer upload function"); // Should print if multer is running

    try {
        console.log("req.body:", req.body);
        console.log("req.files:", req.files);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }

        res.status(200).json({
            message: "Images uploaded successfully",
            files: req.files
        });

    } catch (error) {
        console.error("❌ Error uploading images:", error);
        res.status(500).json({ message: "Upload failed", error });
    }
});


router.post('/',isLoggedIn,isAuthorized, catchAsync(async (req, res, next) => {
    let product = new Product(req.body);
    product = await product.save();
    return res.status(200).json(product);
}))

router.put('/:id',isLoggedIn, catchAsync(async (req, res, next) => {
    console.log('req.method: ', req.method);
    let product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    return res.status(200).json(product);
}))

router.delete('/:id',isLoggedIn,isAuthorized, catchAsync(async (req, res, next) => {
    let product = await Product.findByIdAndDelete(req.params.id);
    return res.status(200).json(product);
}))

export default router;