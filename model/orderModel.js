import mongoose from "mongoose";
import shippingAddressSchema from "./shippingAddressSchema.js";
import orderedItemSchema from "./orderedItemSchema.js";

const orderSchema=new mongoose.Schema({
    email:{type:String,required:true},
    name:{type:String,required:true},
    orderedItems:[orderedItemSchema],
    totalAmount:{type:Number,required:true},
    shippingAddress:shippingAddressSchema,
    paymentMode:{type:String,required:true},
    paymentStatus:{type:String,required:true},
    orderStatus:{type:String,required:true},
    orderDate:{type:String,required:true},
    orderTime:{type:String,required:true},
    createdAt:{type:String,required:true},
});

const Order=mongoose.model('Order',orderSchema);

export default Order;