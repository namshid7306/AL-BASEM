import { authService } from "../services/authService.js";
import { env } from "../config/env.js";

const REFRESH_COOKIE_NAME = "al_basem_refresh_token";

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
});

export const authController = {
  login: async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
      // Return access token and user info without exposing the refresh token in JSON
      res.json({
        token: result.accessToken,
        user: result.user
      });
    } catch (err) {
      next(err);
    }
  },

  refresh: async (req, res, next) => {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      const result = await authService.refresh(rawRefreshToken);
      res.cookie(REFRESH_COOKIE_NAME, result.newRefreshToken, getRefreshCookieOptions());
      res.json({
        token: result.accessToken,
        user: result.user
      });
    } catch (err) {
      next(err);
    }
  },

  getCurrentUser: async (req, res, next) => {
    try {
      const user = await authService.getCurrentUser(req.user._id);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      const result = await authService.logout(rawRefreshToken);
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/api/auth"
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  forgotPassword: async (req, res, next) => {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
