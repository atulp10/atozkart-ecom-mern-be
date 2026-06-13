import mongoose from 'mongoose';

const shippingAddressSchema = new mongoose.Schema({
  fullname: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  addressline1: { type: String, required: true, trim: true, maxlength: 150 },
  addressline2: { type: String, trim: true, maxlength: 150, default: '' },
  area: { type: String, required: true, trim: true, maxlength: 80 },
  city: { type: String, required: true, trim: true, maxlength: 80 },
  pincode: { type: String, required: true, trim: true, match: /^\d{6}$/ },
  state: { type: String, required: true, trim: true, maxlength: 80 },
}, { _id: false });

export default shippingAddressSchema;
