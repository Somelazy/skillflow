const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");
const { publicUserFields, mapUser } = require("../utils/users");

const createToken = (user) =>
  jwt.sign(
    { userId: user.Id_User, login: user.Login, roleId: user.Id_role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

const findStudentRoleId = async () => {
  const result = await pool.query(
    `SELECT "Id_Role" FROM "Roles" WHERE LOWER("Role") = 'student' LIMIT 1`
  );
  return result.rows[0]?.Id_Role || 1;
};

const register = async (req, res) => {
  const { Email, Password_hash, Login, First_name, Last_name, Phone } = req.body;

  if (!Email || !Password_hash || !Login) {
    return res.status(400).json({ success: false, message: "Email, Login и пароль обязательны" });
  }

  if (Password_hash.length < 6) {
    return res.status(400).json({ success: false, message: "Пароль должен быть не короче 6 символов" });
  }

  const existing = await pool.query(
    `SELECT "Id_User" FROM "Users" WHERE "Email" = $1 OR "Login" = $2 LIMIT 1`,
    [Email, Login]
  );

  if (existing.rows[0]) {
    return res.status(409).json({ success: false, message: "Пользователь уже существует" });
  }

  const roleId = await findStudentRoleId();
  const passwordHash = await bcrypt.hash(Password_hash, 10);

  const inserted = await pool.query(
    `INSERT INTO "Users" (
       "Email", "Password_hash", "Id_role", "First_name",
       "Last_name", "Phone", "Created_at", "Login", "Is_active"
     )
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, true)
     RETURNING "Id_User"`,
    [Email, passwordHash, roleId, First_name || null, Last_name || null, Phone || null, Login]
  );

  const userResult = await pool.query(
    `SELECT ${publicUserFields}
     FROM "Users" u
     LEFT JOIN "Roles" r ON r."Id_Role" = u."Id_role"
     WHERE u."Id_User" = $1`,
    [inserted.rows[0].Id_User]
  );

  const user = userResult.rows[0];
  const token = createToken(user);

  res.status(201).json({ success: true, data: { user: mapUser(user), token } });
};

const login = async (req, res) => {
  const { Login, Password_hash } = req.body;

  if (!Login || !Password_hash) {
    return res.status(400).json({ success: false, message: "Login и пароль обязательны" });
  }

  const result = await pool.query(
    `SELECT u.*, r."Role"
     FROM "Users" u
     LEFT JOIN "Roles" r ON r."Id_Role" = u."Id_role"
     WHERE u."Login" = $1 OR u."Email" = $1
     LIMIT 1`,
    [Login]
  );

  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(Password_hash, user.Password_hash || ""))) {
    return res.status(401).json({ success: false, message: "Неверный логин или пароль" });
  }

  const token = createToken(user);

  await pool.query(`UPDATE "Users" SET "Last_login" = NOW(), "Refresh_token" = $1 WHERE "Id_User" = $2`, [
    token,
    user.Id_User,
  ]);

  res.json({ success: true, data: { user: mapUser(user), token } });
};

const me = async (req, res) => {
  res.json({ success: true, data: mapUser(req.user) });
};

module.exports = { register, login, me };
