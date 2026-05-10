const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { getLessonAssignments, createAssignment, updateAssignment, deleteAssignment } = require("../controllers/assignments.controller");

router.get("/lessons/:lessonId/assignments", asyncHandler(getLessonAssignments));
router.post("/lessons/:lessonId/assignments", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(createAssignment));
router.put("/assignments/:id", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(updateAssignment));
router.delete("/assignments/:id", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(deleteAssignment));

module.exports = router;

