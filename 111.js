// Any environment variable will not be accessible without configuring
// dotenv module in the app.
// console.log(process.env.NODE_ENV);
// console.log(process.env.CLOUDINARY_CLOUD_NAME);

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
// Now the env vars will be available in the app, Dotenv is a 
// zero-dependency module that loads environment variables from a .env file
//  into process.env.
// console.log(process.env.NODE_ENV);
// console.log(process.env.CLOUDINARY_CLOUD_NAME);

const express = require('express')
const app = express()
const path = require('path')
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');

const expressError = require('./utilities/ExpressError');

const session = require('express-session');
const flash = require('connect-flash');

const passport = require('passport')
// Passport is authentication middleware for Node.js.A comprehensive set of strategies
// support authentication using a username and password, Facebook, Twitter, and more.
const LocalStrategy = require('passport-local');

const User = require('./models/user');

const mongoSanitize = require('express-mongo-sanitize');
// middleware which sanitizes user-supplied data to prevent 
// MongoDB Operator Injection. This module searches for any keys in 
// objects that begin with '$' or contain a '.' from req.body, req.params
// or req.query. It can then either remove them or replace them with
// allowed characters. 

const helmet = require('helmet');
// Helmet helps secure Express apps by setting HTTP response headers.

const MongoStore = require('connect-mongo');
// For mongo session store
    
const campgroundsRoutes = require('./routes/CampgroundRoutes');
const reviewsRoutes = require('./routes/ReviewsRoutes');
const userRoutes = require('./routes/UserRoutes');

const mongoose = require('mongoose');

// const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp'; //mongodb://127.0.0.1:27017/yelp-camp

//const dbUrl = process.env.NODE_ENV === 'production' ? process.env.DB_URL : 'mongodb://127.0.0.1:27017/yelp-camp'

let dbUrl = '';
if (process.env.NODE_ENV === 'production') {
    dbUrl = process.env.DB_URL;
}
else {
    dbUrl = 'mongodb://127.0.0.1:27017/yelp-camp';
}

mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', () => {
    console.log("Database connected.")
});

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use(mongoSanitize());

app.use(helmet());

// Following bunch of code is regarding Content Security Policy
// (CSP) stuff. This basically shows the list of allowed resources
// outside of the application for scripts, stylesheets, fonts and images.
// Setting this property will allow to show maps and images from mapbox
// and cloudinary, in the application.
// This CSP chunk of code totally copied from course.
// Whichever external resource that would be used in the application going further,
// needs to be added in the Urls below.
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://cdn.jsdelivr.net/",
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dqlnftw5r/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(express.static(path.join(__dirname, 'public')));

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

// Configuring mongo session store
const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: secret,
    }
});

const sessionConfig = {
    store: store,
    name: 'abcd',
    // name of session changed instaed of keeping it as 'connect.sid'
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
}

app.use(session(sessionConfig));

app.use(flash());


// Passport is Express - compatible authentication middleware for Node.js.
// Passport's sole purpose is to authenticate requests, which it does through an extensible
// set of plugins known as strategies. Passport does not mount routes or assume any particular
// database schema, which maximizes flexibility and allows application-level decisions to
// be made by the developer. The API is simple: you provide Passport a request to authenticate,
// and Passport provides hooks for controlling what occurs when authentication succeeds or fails.

// To use Passport in an Express or Connect-based application, configure it with the required
// passport.initialize() middleware. If your application uses persistent login sessions (recommended,
// but not required), passport.session() middleware must also be used.
// Make sure passport.session() is used after app.use(session()).
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
// User.authenticate(), User.serializeUser(), User.deserializeUser() methods are automatically added
// to User model, as passport-local-monoose is plugged in to userSchema.

// Passport will maintain persistent login sessions. In order for persistent sessions to work,
// the authenticated user must be serialized to the session, and deserialized when subsequent 
// requests are made.
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    // When the login operation completes, user will be assigned to req.user, by passport.
    // req.user will have user information such as id, username, email.
    // currentUser variable is defined here to show login,register and logout buttons
    // and edit,delete campground and delete review buttons accordingly.
    next();
})
// In Express.js, res.locals is an object that provides a way to pass data through the 
// application during the request-response cycle. It allows you to store variables that
// can be accessed by your templates and other middleware functions.

app.use('/campgrounds', campgroundsRoutes);
app.use('/campgrounds/:id/reviews', reviewsRoutes);
app.use('/users', userRoutes);

app.listen(3000, () => {
    console.log("App listening on port 3000.")
})



app.get('/', (req, res) => {
    res.render('home')
})








// When no route is matched,then this route is taken.
app.all('*', (req, res, next) => {
    next(new expressError('Page not found!!!!!', 404));
    //res.send("Page not found");
})

app.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Something went wrong!' } = err;
    res.status(statusCode).render('error', { err })
})