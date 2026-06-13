import Product from '../model/productModel.js';
import AppError from '../utils/AppError.js';

export const FREE_SHIPPING_THRESHOLD = 20;
export const SHIPPING_FEE = 5;

export async function priceItems(requestedItems, session) {
  const quantities = new Map();
  for (const item of requestedItems) {
    quantities.set(item.itemId, (quantities.get(item.itemId) || 0) + item.qty);
  }
  const normalizedItems = [...quantities].map(([itemId, qty]) => ({ itemId, qty }));
  const ids = normalizedItems.map((item) => item.itemId);
  const products = await Product.find({ _id: { $in: ids } }).session(session || null);
  const byId = new Map(products.map((product) => [product.id, product]));

  const items = normalizedItems.map(({ itemId, qty }) => {
    const product = byId.get(itemId);
    if (!product) throw new AppError('One or more products no longer exist', 404, 'PRODUCT_NOT_FOUND');
    if (product.stock < qty) throw new AppError(`Insufficient stock for ${product.title}`, 409, 'INSUFFICIENT_STOCK');
    return {
      itemId: product._id,
      title: product.title,
      image: product.image,
      price: product.price,
      qty,
    };
  });

  const subtotal = Math.round(items.reduce((sum, item) => sum + item.price * item.qty, 0) * 100) / 100;
  const shippingAmount = subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
  return { items, subtotal, shippingAmount, totalAmount: subtotal + shippingAmount };
}
