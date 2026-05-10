const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } = require("../controllers/courses.controller");

router.get("/courses", asyncHandler(getCourses));
router.get("/courses/:id", asyncHandler(getCourseById));
router.post("/courses", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(createCourse));
router.put("/courses/:id", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(updateCourse));
router.delete("/courses/:id", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(deleteCourse));

module.exports = router;

