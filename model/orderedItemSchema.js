import mongoose from 'mongoose';

const orderedItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  price: { type: Number, required: true, min: 0.01 },
  qty: { type: Number, required: true, min: 1, validate: Number.isInteger },
  image: { type: String, required: true, maxlength: 2048 },
}, { _id: false });

export default orderedItemSchema;
