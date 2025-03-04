import express from "express";
import { catchAsync } from "../utils/catchAsync.js";
import Order from "../model/orderModel.js";
import { isLoggedIn } from "../middlewares.js";
const router = express.Router();

router.get('/',isLoggedIn, catchAsync(async (req, res, next) => {
    if (req.query.email) {
        const orders = await Order.find({ email: req.query.email });
        return res.status(200).json(orders);
    }
    else {
        const orders = await Order.find({})
        // console.log(orders);  
        return res.status(200).json(orders);
    }
}))

router.post('/',isLoggedIn, catchAsync(async (req, res, next) => {
    const order = new Order(req.body);
    await order.save();
    return res.status(200).json({ message: 'Order created' });
}))

router.put('/:id',isLoggedIn, catchAsync(async (req, res, next) => {
    await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ message: 'Order updated' });
}))

export default router;