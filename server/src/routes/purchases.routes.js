const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const { getMyPurchases, createPurchase } = require("../controllers/purchases.controller");

router.get("/me", authMiddleware, asyncHandler(getMyPurchases));
router.post("/", authMiddleware, asyncHandler(createPurchase));

module.exports = router;
