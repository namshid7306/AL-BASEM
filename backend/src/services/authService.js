import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { env } from "../config/env.js";
import { ROLES } from "../config/constants.js";
import { AppError } from "../middleware/errorHandler.js";
import { logger } from "../utils/logger.js";

export const createAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      cv: user.credentialsVersion ?? 1
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

export const createRefreshToken = async (user, familyId = null) => {
  const tokenId = uuidv4();
  const tokenFamilyId = familyId || uuidv4();

  const refreshToken = jwt.sign(
    { sub: user._id.toString(), jti: tokenId, fid: tokenFamilyId },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN }
  );

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    tokenId,
    familyId: tokenFamilyId,
    expiresAt
  });

  return { refreshToken, tokenId, familyId: tokenFamilyId };
};

export const authService = {
  syncDefaultAdmin: async () => {
    const normalizedAdminEmail = env.ADMIN_EMAIL.trim().toLowerCase();

    // Query existing administrators
    const admins = await User.find({ role: ROLES.ADMIN });

    if (admins.length > 1) {
      throw new Error(
        `Multiple administrator accounts detected in database (${admins.length} found). Manual cleanup required to maintain single-admin architecture.`
      );
    }

    if (admins.length === 0) {
      const existingUser = await User.findOne({ email: normalizedAdminEmail });
      if (existingUser) {
        throw new Error(
          `User with email ${normalizedAdminEmail} already exists with role ${existingUser.role}. Manual intervention required.`
        );
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, salt);

      await User.create({
        name: "Al Basem Admin",
        email: normalizedAdminEmail,
        passwordHash,
        role: ROLES.ADMIN,
        phone: "+971 50 123 4567",
        avatar: "AB",
        credentialsVersion: 1
      });

      logger.info("Admin account created");
      return;
    }

    const admin = admins[0];
    const currentEmail = admin.email.trim().toLowerCase();
    const emailChanged = currentEmail !== normalizedAdminEmail;

    const passwordMatches = await bcrypt.compare(env.ADMIN_PASSWORD, admin.passwordHash);
    const passwordChanged = !passwordMatches;

    if (!emailChanged && !passwordChanged) {
      logger.info("Admin credentials already synchronized");
      return;
    }

    if (emailChanged) {
      admin.email = normalizedAdminEmail;
    }

    if (passwordChanged) {
      const salt = await bcrypt.genSalt(10);
      admin.passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, salt);
    }

    admin.credentialsVersion = (admin.credentialsVersion || 1) + 1;
    await admin.save();

    // Revoke all active refresh token sessions for this admin
    await RefreshToken.updateMany(
      { userId: admin._id, revokedAt: null },
      { revokedAt: new Date() }
    );

    if (emailChanged && passwordChanged) {
      logger.info("Admin email and password updated. Existing admin sessions revoked.");
    } else if (emailChanged) {
      logger.info("Admin email updated. Existing admin sessions revoked.");
    } else if (passwordChanged) {
      logger.info("Admin password updated. Existing admin sessions revoked.");
    }
  },

  seedDefaultAdmin: async function () {
    return this.syncDefaultAdmin();
  },

  login: async ({ email, password }) => {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    const accessToken = createAccessToken(user);
    const { refreshToken } = await createRefreshToken(user);

    logger.info("Admin login successful", { userId: user._id.toString() });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone
      }
    };
  },

  refresh: async (rawRefreshToken) => {
    if (!rawRefreshToken || typeof rawRefreshToken !== "string") {
      throw new AppError("Refresh token required", 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(rawRefreshToken, env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new AppError("Refresh token expired", 401);
      }
      throw new AppError("Invalid refresh token", 401);
    }

    if (!decoded.jti || !decoded.sub) {
      throw new AppError("Invalid refresh token structure", 401);
    }

    const tokenRecord = await RefreshToken.findOne({ tokenId: decoded.jti });
    if (!tokenRecord) {
      throw new AppError("Refresh token not found or invalid", 401);
    }

    const computedHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
    if (tokenRecord.tokenHash !== computedHash) {
      throw new AppError("Refresh token hash mismatch", 401);
    }

    // Replay attack detection: if this token was already revoked, invalidate entire token family
    if (tokenRecord.revokedAt) {
      logger.warn("Refresh token replay attack detected", {
        tokenId: tokenRecord.tokenId,
        familyId: tokenRecord.familyId,
        userId: tokenRecord.userId.toString()
      });
      await RefreshToken.updateMany(
        { familyId: tokenRecord.familyId },
        { revokedAt: new Date() }
      );
      throw new AppError("Refresh token has been revoked (replay detected)", 401);
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new AppError("Refresh token expired", 401);
    }

    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 401);
    }

    // Rotate token within the same token family
    const { refreshToken: newRefreshToken, tokenId: newTokenId } = await createRefreshToken(
      user,
      tokenRecord.familyId
    );

    // Revoke old token record and track replacement
    tokenRecord.revokedAt = new Date();
    tokenRecord.replacedByTokenId = newTokenId;
    await tokenRecord.save();

    const accessToken = createAccessToken(user);

    logger.info("Access token refreshed and rotated successfully", {
      userId: user._id.toString()
    });

    return {
      accessToken,
      newRefreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone
      }
    };
  },

  logout: async (rawRefreshToken) => {
    if (rawRefreshToken && typeof rawRefreshToken === "string") {
      try {
        const decoded = jwt.verify(rawRefreshToken, env.REFRESH_TOKEN_SECRET, {
          ignoreExpiration: true
        });
        if (decoded && decoded.jti) {
          const tokenRecord = await RefreshToken.findOne({ tokenId: decoded.jti });
          if (tokenRecord && !tokenRecord.revokedAt) {
            tokenRecord.revokedAt = new Date();
            await tokenRecord.save();
            if (tokenRecord.familyId) {
              await RefreshToken.updateMany(
                { familyId: tokenRecord.familyId },
                { revokedAt: new Date() }
              );
            }
          }
        }
      } catch {
        // Ignore token decode/verification errors during logout
      }
    }
    return { success: true, message: "Logged out successfully" };
  },

  getCurrentUser: async (userId) => {
    const user = await User.findById(userId).select("-passwordHash");
    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 401);
    }
    return user;
  },

  forgotPassword: async (email) => {
    // Security: Do not reveal whether user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      // In production, dispatch email reset token via secure mailer
    }
    return {
      message: "If an account with that email exists, a password reset link has been sent."
    };
  }
};
