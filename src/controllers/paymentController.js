const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const crypto = require("crypto");
const mailSender = require("../utils/mailSender");

// ─── Step 1: Create Razorpay Order ───────────────────────
exports.capturePayment = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId) {
      return res
        .status(400)
        .json({ success: false, message: "Course ID is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const alreadyEnrolled = await Enrollment.findOne({
      courseId,
      userId,
      status: "Completed",
    });
    if (alreadyEnrolled) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You are already enrolled in this course",
        });
    }

    const options = {
      amount: course.price * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      courseName: course.courseName,
    });
  } catch (error) {
    console.error("capturePayment full error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Could not initiate payment",
    });
  }
};

// ─── Step 2: Verify Signature ─────────────────────────────
exports.verifySignature = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
    } = req.body;
    const userId = req.user.id;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !courseId
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payment fields" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    const enrollment = await Enrollment.create({
      courseId,
      userId,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: "Completed",
    });

    await User.findByIdAndUpdate(userId, {
      $push: { enrollments: enrollment._id },
    });

    try {
      const [user, course] = await Promise.all([
        User.findById(userId).select("name email"),
        Course.findById(courseId).select("courseName price"),
      ]);
      await mailSender(
        user.email,
        "Enrollment Confirmed — Course Management System - CMS",
        `<p>Hi ${user.name}, you enrolled in <strong>${course.courseName}</strong>. Amount: ₹${course.price}</p>`,
      );
    } catch (mailErr) {
      console.log("Email failed (non-critical):", mailErr.message);
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Enrollment successful!",
        enrollmentId: enrollment._id,
      });
  } catch (error) {
    console.error("verifySignature full error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: error?.message || "Verification failed",
      });
  }
};

// ─── Get My Enrollments ───────────────────────────────────
exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      userId: req.user.id,
      status: "Completed",
    })
      .populate("courseId", "courseName courseDescription price thumbnail")
      .sort({ createdAt: -1 });

    const data = enrollments.map((e) => ({
      _id: e._id,
      course: e.courseId,
      paymentId: e.paymentId,
      status: e.status,
      createdAt: e.createdAt,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("getMyEnrollments error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch enrollments" });
  }
};
