const pool = require("../db/pool");
const { publicUserFields, mapUser } = require("../utils/users");

const getMe = async (req, res) => {
  res.json({ success: true, data: mapUser(req.user) });
};

const updateMe = async (req, res) => {
  const {
    First_name,
    Last_name,
    Phone,
    Login,
    Avatar_url,
    Birthdate,
    Gender,
    Country,
    City,
    Bio,
    Social_links,
    Settings,
  } = req.body;

  if (Login && Login !== req.user.Login) {
    const existing = await pool.query(
      `SELECT "Id_User" FROM "Users" WHERE "Login" = $1 AND "Id_User" <> $2 LIMIT 1`,
      [Login, req.user.Id_User]
    );
    if (existing.rows[0]) {
      return res.status(409).json({ success: false, message: "Этот логин уже занят" });
    }
  }

  await pool.query(
    `UPDATE "Users"
     SET "First_name" = $1, "Last_name" = $2, "Phone" = $3, "Login" = $4,
         "Avatar_url" = $5, "Birthdate" = $6, "Gender" = $7, "Country" = $8,
         "City" = $9, "Bio" = $10, "Social_links" = $11, "Settings" = $12,
         "Updated_at" = CURRENT_TIMESTAMP
     WHERE "Id_User" = $13`,
    [
      First_name ?? req.user.First_name,
      Last_name ?? req.user.Last_name,
      Phone ?? req.user.Phone,
      Login ?? req.user.Login,
      Avatar_url ?? req.user.Avatar_url,
      Birthdate ?? req.user.Birthdate,
      Gender ?? req.user.Gender,
      Country ?? req.user.Country,
      City ?? req.user.City,
      Bio ?? req.user.Bio,
      Social_links ?? req.user.Social_links,
      Settings ?? req.user.Settings,
      req.user.Id_User,
    ]
  );

  const result = await pool.query(
    `SELECT ${publicUserFields}
     FROM "Users" u
     LEFT JOIN "Roles" r ON r."Id_Role" = u."Id_role"
     WHERE u."Id_User" = $1`,
    [req.user.Id_User]
  );

  res.json({ success: true, data: mapUser(result.rows[0]) });
};

const getUserById = async (req, res) => {
  const result = await pool.query(
    `SELECT ${publicUserFields}
     FROM "Users" u
     LEFT JOIN "Roles" r ON r."Id_Role" = u."Id_role"
     WHERE u."Id_User" = $1
     LIMIT 1`,
    [req.params.id]
  );

  if (!result.rows[0]) {
    return res.status(404).json({ success: false, message: "Пользователь не найден" });
  }

  res.json({ success: true, data: mapUser(result.rows[0]) });
};

module.exports = { getMe, updateMe, getUserById };

