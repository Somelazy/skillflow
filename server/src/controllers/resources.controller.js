const pool = require("../db/pool");
const { mapResource } = require("../utils/courses");

const getLessonResources = async (req, res) => {
  const result = await pool.query(`SELECT * FROM "Resources" WHERE "Id_Lesson" = $1 ORDER BY "Id_Resource"`, [
    req.params.lessonId,
  ]);
  res.json({ success: true, data: result.rows.map(mapResource) });
};

const createResource = async (req, res) => {
  const { File_Name, File_Url, File_Type } = req.body;
  if (!File_Name || !File_Url) {
    return res.status(400).json({ success: false, message: "File_Name и File_Url обязательны" });
  }
  const result = await pool.query(
    `INSERT INTO "Resources" ("Id_Lesson", "File_Name", "File_Url", "File_Type", "Uploaded_At")
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     RETURNING *`,
    [req.params.lessonId, File_Name, File_Url, File_Type || null]
  );
  res.status(201).json({ success: true, data: mapResource(result.rows[0]) });
};

const deleteResource = async (req, res) => {
  const result = await pool.query(`DELETE FROM "Resources" WHERE "Id_Resource" = $1 RETURNING "Id_Resource"`, [
    req.params.id,
  ]);
  if (!result.rows[0]) return res.status(404).json({ success: false, message: "Ресурс не найден" });
  res.json({ success: true, message: "Ресурс удалён" });
};

module.exports = { getLessonResources, createResource, deleteResource };
