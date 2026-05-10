const jwt = require("jsonwebtoken");
const pool = require("../db/pool");
const { publicUserFields } = require("../utils/users");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ success: false, message: "Требуется авторизация" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const result = await pool.query(
      `SELECT ${publicUserFields}
       FROM "Users" u
       LEFT JOIN "Roles" r ON r."Id_Role" = u."Id_role"
       WHERE u."Id_User" = $1 AND COALESCE(u."Is_active", true) = true
       LIMIT 1`,
      [decoded.userId]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ success: false, message: "Пользователь не найден" });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Недействительный токен" });
  }
};

module.exports = authMiddleware;

