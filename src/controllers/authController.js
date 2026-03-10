const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");

// ─── Signup ───────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 6 characters",
        });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({
          success: false,
          message: "User already exists with this email",
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    return res.status(201).json({
      success: true,
      message: "Account created successfully! Please login.",
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Signup failed. Please try again." });
  }
};

// ─── Login ────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "No account found with this email" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Cookie + JSON both (frontend uses Bearer token)
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "lax",
    };

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.cookie("token", token, cookieOptions).status(200).json({
      success: true,
      token,
      user: userResponse,
      message: "Logged in successfully",
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Login failed. Please try again." });
  }
};

// ─── Forgot Password ──────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Security: don't reveal if email exists or not
      return res.status(200).json({
        success: true,
        message: "If this email is registered, a reset link has been sent.",
      });
    }

    // Generate a short-lived reset token
    const resetToken = jwt.sign(
      { id: user._id, email: user.email, purpose: "reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

    await mailSender(
      email,
      "Password Reset — Course Management System - CMS",
      `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #2563eb;">Reset Your Password</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>You requested a password reset. Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block; padding: 12px 24px; background: #2563eb; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #94a3b8; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    );

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to send reset email. Try again.",
      });
  }
};

// ─── Get Profile ──────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("enrollments");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Get profile error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Could not fetch profile" });
  }
};

// ─── Update Profile ───────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name cannot be empty" });
    }

    const updateData = { name: name.trim() };

    // Only update password if provided
    if (password) {
      if (password.length < 6) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Password must be at least 6 characters",
          });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Profile update failed" });
  }
};
