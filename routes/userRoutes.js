import express from "express";
import { catchAsync } from "../utils/catchAsync.js";
import User from "../model/userModel.js";
import passport from "passport";
const router = express.Router();

export default router;

router.post('/register', catchAsync(async (req, res, next) => {
    const { email, username, password, createdAt, role } = req.body;
    let user = new User({ email, username, createdAt, role });
    user = await User.register(user, password);
    // res.status(200).send({message:'User registered'})

    req.login(user, err => {
      if (err) return next(err);
      return res.status(200).json(req.user);
    })
 }))

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err); // Handle error
    }
    if (!user) {
      return res.status(401).send(info.message); // Send error message to the frontend
    }
    req.login(user, (err) => {
      if (err) {
        return next(err); // Handle error
      }
      return res.status(200).json(req.user);
    });
  })(req, res, next);
});

router.get('/logout', (req, res, next) => {
  console.log('/logout route');
  console.log(req.user);
  req.logout(function (err) { // used for logout, Passport method on req object
    if (err) {
      console.log('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed', error: err.message });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: 'Failed to destroy session' });
      }
      res.clearCookie('connect.sid'); // Clears session cookie (if applicable)
      res.status(200).json({ message: 'Logged out successfully' });
    })
  })
})