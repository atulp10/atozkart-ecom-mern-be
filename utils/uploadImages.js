import { storage } from "../cloudinary/cloudinaryIndex.js";
import multer from "multer";
const upload = multer({ storage:storage });

export const uploadImages=async(req,res,next)=>{
    try{
        let res= upload.array('images');
        console.log(res);
        next();
    }
    catch(err){
        console.log(err);
        next(err);
    }
    
    
}