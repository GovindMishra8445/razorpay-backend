const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const { getUserDetails } = require("../controllers/profileController");

router.get("/getUserDetails", protect, getUserDetails);

module.exports = router;