import mongoose from "mongoose";

const productSchema=new mongoose.Schema({
    title:{type:String, required:true},
    price:{type:Number,required:true},
    category:{type:String,required:true},
    stock:{type:Number,required:true},
    image:String,
    brand:String,
    description:String,
    createdAt:String,
    updatedAt:String,
});

const Product=mongoose.model('Product',productSchema);

export default Product;