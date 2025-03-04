import express from "express";
import 'dotenv/config'
import Stripe from "stripe";
import cors from "cors";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import AppError from "./utils/AppError.js";
import session from "express-session";
import passport from "passport";
import localStrategy from "passport-local";
import flash from "connect-flash";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import User from "./model/userModel.js";
import { isLoggedIn } from "./middlewares.js";

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const dbURL = process.env.DB_URL;
// 'mongodb://127.0.0.1:27017/MERN1'
mongoose.connect(dbURL,
    {
        family: 4, // Force IPv4
        serverSelectionTimeoutMS: 30000,
    }
)
    .then(() => console.log('MERN DB connected.'))
    .catch(err => console.log('DB connection error...', err));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'abcde'
    }
});

store.on('error',function(e){
    console.log('Mongo Session Store Error',e);
    
})

app.use(cors({
    origin: 'http://localhost:5173',  // Your React frontend URL
    // methods: ['GET', 'POST'],
    credentials: true  // Allow credentials (cookies)
}));
// // Handle preflight OPTIONS request explicitly
// app.options('*', cors({
//     origin: 'http://localhost:5173',
//     credentials: true
// }));
app.use(express.json());
app.use(cookieParser());

app.use(session({
    store,
    secret: 'abcde',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        // sameSite: 'none',
        secure: false,
        // secure: process.env.NODE_ENV === 'production'
    }
}))
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
// passport.use(new localStrategy({usernameField:'email'},User.authenticate()));
passport.use(new localStrategy({
    usernameField: 'email',
    passwordField: 'password',
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email: email }).exec();
        if (!user) {
            return done(null, false, { message: 'Incorrect email.' });
        }
        const isMatch = await user.authenticate(password);
        if (!isMatch.user) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        console.log('User authenticated:', user); // Debugging
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// passport.serializeUser((user, done) => {
//     console.log('Serializing user:', user); // Debugging
//     done(null, user._id);
//     // console.log('serialized: ',req.passport);

// });

// passport.deserializeUser(async (id, done) => {
//     try {
//         const user = await User.findById(id);
//         if (user) {
//             console.log('Deserializing user:', user); // Log the deserialization process
//             done(null, user);
//         } else {
//             done(null, false, { message: 'User not found.' });
//         }
//     } catch (err) {
//         console.error('Error during deserialization:', err); // Log the error if any
//         done(err);
//     }
// });

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {
    console.log('*************************');
    console.log('*************************');
    console.log('Session:', req.session);
    console.log('Session ID:', req.sessionID);  // Log session ID
    console.log('req.seesion.passport: ', req.session.passport);
    console.log('User:', req.user);
    console.log('req.cookies: ', req.cookies);
    console.log('Response Headers:', res.getHeaders());

    next();
});
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/users', userRoutes);

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: `${process.env.EMAIL}`,
        pass: `${process.env.PWD}`,
    },
});

app.get('/', (req, res) => {
    res.send('Hello from server');
})



app.post('/sendemail', isLoggedIn, async (req, res) => {
    const { email, name, orderedItems, totalAmount,
        shippingAddress, paymentMode, orderStatus, paymentStatus,
        orderDate, orderTime, createdAt } = req.body;
    // console.log(req.body);

    try {
        const info = await transporter.sendMail({
            from: `"Atul Prajapati" ${process.env.EMAIL}`, // sender address
            to: email, // list of receivers
            subject: `Order ${orderStatus}`, // Subject line
            text: "Hello world?", // plain text body
            html: `<b>Hello ${name}</b><br>
            ${orderStatus === 'placed' ? '<span>Thank you for your order.</span><br>' : ''}
            <span>Here is your order details: </span><br>
            <span>Total amount: ${totalAmount}</span><br>
            <span>Payment mode: ${paymentMode}</span><br>
            <span>Order status: ${orderStatus}</span><br>
            <span>Order Date and Time: ${orderDate} ${orderTime}</span><br>`, // html body
        });

        console.log("Message sent: %s", info.messageId);
        //Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
        res.send({ message: "Mail Sent Successfully" })
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "something went wrong" });
    }
})

app.post('/create-payment-intent', isLoggedIn, async (req, res) => {
    console.log(req.body) //{amount:10000}
    try {
        const paymentIntents = await stripe.paymentIntents.create({
            amount: (req.body.amount) * 100, // 100.00,
            currency: "usd",
            payment_method_types: ['card']
        })
        console.log(paymentIntents.client_secret)
        res.status(200).json({ clientSecret: paymentIntents.client_secret })
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
});

app.all('*', (req, res) => {
    return res.status(400).json({ message: 'Bad request...' });
})

app.use((err, req, res, next) => {
    const { message = 'Internal server error', statusCode = 500 } = err;
    return res.status(statusCode).json({ message })
})

app.listen('8080', () => { console.log('App listening on port 8080') })