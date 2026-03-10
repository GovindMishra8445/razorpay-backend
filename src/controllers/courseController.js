const Course = require("../models/Course");

// ─── Get All Courses ───────────
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: courses });
  } catch (error) {
    console.error("Get courses error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch courses" });
  }
};

// ─── Create Course ──────────────
exports.createCourse = async (req, res) => {
  try {
    const { courseName, courseDescription, price, thumbnail } = req.body;

    // Validation
    if (!courseName || !courseName.trim()) {
      return res.status(400).json({ success: false, message: "Course name is required" });
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: "Valid price is required" });
    }

    // Duplicate check
    const existing = await Course.findOne({ courseName: courseName.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: "A course with this name already exists" });
    }

    const course = await Course.create({
      courseName: courseName.trim(),
      courseDescription: courseDescription?.trim() || "",
      price: Number(price),
      thumbnail: thumbnail?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("Create course error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create course" });
  }
};

// ─── Delete Course ───────────
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    return res.status(200).json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete course error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete course" });
  }
};

// ─── Update Course ────────────────
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseName, courseDescription, price, thumbnail } = req.body;

    if (!courseName || !courseName.trim()) {
      return res.status(400).json({ success: false, message: "Course name is required" });
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: "Valid price is required" });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      {
        courseName: courseName.trim(),
        courseDescription: courseDescription?.trim() || "",
        price: Number(price),
        thumbnail: thumbnail?.trim() || "",
      },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Update course error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update course" });
  }
};