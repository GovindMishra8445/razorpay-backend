const express = require("express");
const router = express.Router();
const {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");
const { protect } = require("../middleware/auth");

router.get("/get-courses", getAllCourses);

const { isAdmin } = require("../middleware/isAdmin");

router.post("/create-course", protect, isAdmin, createCourse);
router.put("/update-course/:id", protect, isAdmin, updateCourse);
router.delete("/delete-course/:id", protect, isAdmin, deleteCourse);

module.exports = router;