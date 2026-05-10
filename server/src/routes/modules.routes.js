const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { getCourseModules, getModuleById, createModule, updateModule, deleteModule } = require("../controllers/modules.controller");

router.get("/courses/:courseId/modules", asyncHandler(getCourseModules));
router.get("/modules/:id", asyncHandler(getModuleById));
router.post("/courses/:courseId/modules", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(createModule));
router.put("/modules/:id", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(updateModule));
router.delete("/modules/:id", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(deleteModule));

module.exports = router;

