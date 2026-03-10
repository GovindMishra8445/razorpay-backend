const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  getProfile,
  forgotPassword,
  updateProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);

router.get("/profile", protect, getProfile);
router.put("/update-profile", protect, updateProfile);

module.exports = router;