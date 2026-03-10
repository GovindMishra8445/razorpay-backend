const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    paymentId: {
        type: String,
        required: true,
    },
    orderId: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["Pending", "Completed", "Failed"],
        default: "Pending",
    }
}, { timestamps: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);