import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";

const userSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    username:{
        type:String,
        required:true
    },
    createdAt:String,
    role:{
        type:String,
        enum:['User','Admin']
    }
})

userSchema.plugin(passportLocalMongoose,{usernameField:'email'});
// This plugin by passport automatically adds username and password(with hash nd salt)
// properties to this userSchema. Also makes sure that usernames are unique.

const User=mongoose.model('User',userSchema);

export default User;