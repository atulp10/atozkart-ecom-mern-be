import mongoose from "mongoose";

const shippingAddressSchema=new mongoose.Schema({
    fullname:{type:String,required:true},
        phone:{type:String,required:true},
        email:{type:String,required:true},
        addressline1:{type:String,required:true},
        addressline2:String,
        area:String,
        city:{type:String,required:true},
        pincode:{type:Number,required:true},
        state:String     
})

export default shippingAddressSchema