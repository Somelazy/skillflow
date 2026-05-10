const pool = require("../db/pool");

const getMyPurchases = async (req, res) => {
  const result = await pool.query(
    `SELECT p.*, c."Title" AS course_title, c."Description" AS course_description
     FROM "Purchases" p
     LEFT JOIN "Courses" c ON c."Id_Course" = p."Id_course"
     WHERE p."Id_user" = $1
     ORDER BY p."Purchased_at" DESC NULLS LAST`,
    [req.user.Id_User]
  );
  res.json({ success: true, data: result.rows });
};

const createPurchase = async (req, res) => {
  const { Id_course, Amount, Payment_method } = req.body;
  if (!Id_course || Amount === undefined) {
    return res.status(400).json({ success: false, message: "Id_course и Amount обязательны" });
  }

  const transactionId = `sf-${Date.now()}-${req.user.Id_User}`;
  const result = await pool.query(
    `INSERT INTO "Purchases" (
       "Id_user", "Id_course", "Amount", "Payment_status",
       "Payment_method", "Id_transaction", "Purchased_at"
     )
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
     RETURNING *`,
    [req.user.Id_User, Id_course, String(Amount), "P", Payment_method || "card", transactionId]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
};

module.exports = { getMyPurchases, createPurchase };
