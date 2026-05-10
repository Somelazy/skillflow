const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { getMe, updateMe, getUserById } = require("../controllers/users.controller");

router.get("/me", authMiddleware, asyncHandler(getMe));
router.put("/me", authMiddleware, asyncHandler(updateMe));
router.get("/:id", authMiddleware, roleMiddleware("Admin", "Mentor", 4, 3), asyncHandler(getUserById));

module.exports = router;

