const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { getLessonResources, createResource, deleteResource } = require("../controllers/resources.controller");

router.get("/lessons/:lessonId/resources", asyncHandler(getLessonResources));
router.post("/lessons/:lessonId/resources", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(createResource));
router.delete("/resources/:id", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(deleteResource));

module.exports = router;

