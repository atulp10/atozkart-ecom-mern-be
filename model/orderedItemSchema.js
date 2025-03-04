import mongoose from "mongoose";

const orderedItemSchema=new mongoose.Schema({
    itemId:String,
    title:String,
    price:Number,
    qty:Number,
    image:String
})

export default orderedItemSchema;