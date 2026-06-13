import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[A-Za-z0-9_]+$/,
  },
  role: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'User',
    required: true,
  },
}, { timestamps: true });

userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  usernameLowerCase: true,
  usernameUnique: true,
  errorMessages: { UserExistsError: 'An account with this email already exists' },
});

const User = mongoose.model('User', userSchema);
export default User;
