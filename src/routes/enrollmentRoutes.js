const express = require("express");
const router = express.Router();

const { getMyEnrollments } = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.get("/my-enrollments", protect, getMyEnrollments);

module.exports = router;