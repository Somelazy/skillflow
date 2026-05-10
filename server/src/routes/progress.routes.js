const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const { getUserProgress, getCourseProgress, startLesson, completeLesson, updateLessonProgress } = require("../controllers/progress.controller");

router.get("/me", authMiddleware, asyncHandler(getUserProgress));
router.get("/me/course/:courseId", authMiddleware, asyncHandler(getCourseProgress));
router.post("/lesson/:lessonId/start", authMiddleware, asyncHandler(startLesson));
router.post("/lesson/:lessonId/complete", authMiddleware, asyncHandler(completeLesson));
router.put("/lesson/:lessonId", authMiddleware, asyncHandler(updateLessonProgress));

module.exports = router;

