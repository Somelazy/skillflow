const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { getModuleLessons, getLessonById, createLesson, updateLesson, deleteLesson } = require("../controllers/lessons.controller");

router.get("/modules/:moduleId/lessons", asyncHandler(getModuleLessons));
router.get("/lessons/:id", authMiddleware, asyncHandler(getLessonById));
router.post("/modules/:moduleId/lessons", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(createLesson));
router.put("/lessons/:id", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(updateLesson));
router.delete("/lessons/:id", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(deleteLesson));

module.exports = router;
