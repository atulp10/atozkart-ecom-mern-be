import mongoose from 'mongoose';

export const PRODUCT_CATEGORIES = ['Electronics', 'Fashion', 'Beauty', 'Home', 'Books', 'Grocery', 'Art & Craft'];

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  price: { type: Number, required: true, min: 0.01, max: 10000000 },
  category: { type: String, required: true, enum: PRODUCT_CATEGORIES },
  stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
  image: { type: String, required: true, trim: true, maxlength: 2048 },
  imagePublicId: { type: String, trim: true },
  brand: { type: String, trim: true, maxlength: 80, default: '' },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
