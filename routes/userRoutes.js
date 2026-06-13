import express from 'express';
import passport from 'passport';
import User from '../model/userModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import { validate } from '../utils/validation.js';
import { loginSchema, registerSchema } from '../schemas/requests.js';
import { toUserDto } from '../utils/userDto.js';
import { authLimiter } from '../middlewares/security.js';
import { isLoggedIn } from '../middlewares.js';
import AppError from '../utils/AppError.js';
import { getConfig } from '../config/env.js';

const router = express.Router();

router.post('/register', authLimiter, catchAsync(async (req, res, next) => {
  const data = validate(registerSchema, req.body);
  const user = await User.register(new User({ email: data.email, username: data.username, role: 'User' }), data.password);
  req.login(user, (error) => {
    if (error) return next(error);
    return res.status(201).json(toUserDto(user));
  });
}));

router.post('/login', authLimiter, (req, res, next) => {
  req.body = validate(loginSchema, req.body);
  passport.authenticate('local', (error, user) => {
    if (error) return next(error);
    if (!user) return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    return req.login(user, (loginError) => {
      if (loginError) return next(loginError);
      return res.status(200).json(toUserDto(user));
    });
  })(req, res, next);
});

router.get('/me', isLoggedIn, (req, res) => res.json(toUserDto(req.user)));

router.post('/logout', isLoggedIn, (req, res, next) => {
  req.logout((logoutError) => {
    if (logoutError) return next(logoutError);
    return req.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError);
      const config = getConfig();
      res.clearCookie(config.sessionName, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction ? 'none' : 'lax',
        path: '/',
      });
      return res.status(204).end();
    });
  });
});

export default router;
