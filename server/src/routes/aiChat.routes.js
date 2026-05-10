const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const { sendMessage } = require("../controllers/aiChat.controller");

router.post("/", asyncHandler(sendMessage));

module.exports = router;

