const pool = require("../db/pool");
const { mapModule } = require("../utils/courses");

const getCourseModules = async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM "Modules" WHERE "Id_Course" = $1 ORDER BY "Order_Num", "Id_Module"`,
    [req.params.courseId]
  );
  res.json({ success: true, data: result.rows.map(mapModule) });
};

const getModuleById = async (req, res) => {
  const result = await pool.query(`SELECT * FROM "Modules" WHERE "Id_Module" = $1 LIMIT 1`, [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ success: false, message: "Модуль не найден" });
  res.json({ success: true, data: mapModule(result.rows[0]) });
};

const createModule = async (req, res) => {
  const { Title, Description, Order_Num } = req.body;
  if (!Title || Order_Num === undefined) {
    return res.status(400).json({ success: false, message: "Title и Order_Num обязательны" });
  }
  const result = await pool.query(
    `INSERT INTO "Modules" ("Id_Course", "Title", "Description", "Order_Num", "Created_At", "Updated_At")
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [req.params.courseId, Title, Description || null, Order_Num]
  );
  res.status(201).json({ success: true, data: mapModule(result.rows[0]) });
};

const updateModule = async (req, res) => {
  const current = await pool.query(`SELECT * FROM "Modules" WHERE "Id_Module" = $1 LIMIT 1`, [req.params.id]);
  if (!current.rows[0]) return res.status(404).json({ success: false, message: "Модуль не найден" });
  const module = current.rows[0];
  const { Title, Description, Order_Num } = req.body;
  const result = await pool.query(
    `UPDATE "Modules"
     SET "Title" = $1, "Description" = $2, "Order_Num" = $3, "Updated_At" = CURRENT_TIMESTAMP
     WHERE "Id_Module" = $4
     RETURNING *`,
    [Title ?? module.Title, Description ?? module.Description, Order_Num ?? module.Order_Num, req.params.id]
  );
  res.json({ success: true, data: mapModule(result.rows[0]) });
};

const deleteModule = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const lessonResult = await client.query(`SELECT "Id_Lesson" FROM "Lessons" WHERE "Id_Module" = $1`, [req.params.id]);
    const lessonIds = lessonResult.rows.map((lesson) => lesson.Id_Lesson);

    if (lessonIds.length) {
      await client.query(`DELETE FROM "Student_Progress" WHERE "Id_Lesson" = ANY($1::int[])`, [lessonIds]);
      await client.query(`DELETE FROM "Assignments" WHERE "Id_Lesson" = ANY($1::int[])`, [lessonIds]);
      await client.query(`DELETE FROM "Resources" WHERE "Id_Lesson" = ANY($1::int[])`, [lessonIds]);
    }

    await client.query(`DELETE FROM "Lessons" WHERE "Id_Module" = $1`, [req.params.id]);
    const result = await client.query(`DELETE FROM "Modules" WHERE "Id_Module" = $1 RETURNING "Id_Module"`, [
      req.params.id,
    ]);
    if (!result.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Модуль не найден" });
    }
    await client.query("COMMIT");
    res.json({ success: true, message: "Модуль удалён" });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { getCourseModules, getModuleById, createModule, updateModule, deleteModule };
