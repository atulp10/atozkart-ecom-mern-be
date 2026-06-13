import express from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import Product from '../model/productModel.js';
import { cloudinary } from '../cloudinary/cloudinaryIndex.js';
import { isAuthorized, isLoggedIn } from '../middlewares.js';
import { catchAsync } from '../utils/catchAsync.js';
import { validate } from '../utils/validation.js';
import { productPatchSchema, productSchema } from '../schemas/requests.js';
import AppError from '../utils/AppError.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)),
});

router.get('/', catchAsync(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 100));
  const sort = ['price', '-price', 'createdAt', '-createdAt'].includes(req.query.sort) ? req.query.sort : '-createdAt';
  const products = await Product.find({}).sort(sort).skip((page - 1) * limit).limit(limit).lean();
  res.json(products);
}));

router.get('/:id', catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
  res.json(product);
}));

router.post('/images', isLoggedIn, isAuthorized, upload.single('image'), catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('A valid image is required', 400, 'INVALID_IMAGE');
  const publicId = `atozkart/${randomUUID()}`;
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ public_id: publicId, resource_type: 'image' }, (error, uploaded) => error ? reject(error) : resolve(uploaded));
    stream.end(req.file.buffer);
  });
  res.status(201).json({ image: result.secure_url, imagePublicId: result.public_id });
}));

router.post('/', isLoggedIn, isAuthorized, catchAsync(async (req, res) => {
  const data = validate(productSchema, req.body);
  const product = await Product.create(data);
  res.status(201).json(product);
}));

router.put('/:id', isLoggedIn, isAuthorized, catchAsync(async (req, res) => {
  const data = validate(productPatchSchema, req.body);
  const product = await Product.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
  res.json(product);
}));

router.delete('/:id', isLoggedIn, isAuthorized, catchAsync(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
  if (product.imagePublicId) await cloudinary.uploader.destroy(product.imagePublicId);
  res.status(204).end();
}));

export default router;
