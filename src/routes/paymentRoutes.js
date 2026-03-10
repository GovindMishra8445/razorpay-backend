const express = require("express");
const router = express.Router();
const {
  capturePayment,
  verifySignature,
  getMyEnrollments,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.post("/capturePayment", protect, capturePayment);
router.post("/verifySignature", protect, verifySignature);
router.get("/my-enrollments", protect, getMyEnrollments);

module.exports = router;