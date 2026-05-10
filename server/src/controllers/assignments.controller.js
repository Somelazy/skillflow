const pool = require("../db/pool");
const { mapAssignment } = require("../utils/courses");

const getLessonAssignments = async (req, res) => {
  const result = await pool.query(`SELECT * FROM "Assignments" WHERE "Id_Lesson" = $1 ORDER BY "Id_Assignment"`, [
    req.params.lessonId,
  ]);
  res.json({ success: true, data: result.rows.map(mapAssignment) });
};

const createAssignment = async (req, res) => {
  const { Type, Question, Max_Score, Answers, Correct_Answer } = req.body;
  if (!Type || !Question) {
    return res.status(400).json({ success: false, message: "Type и Question обязательны" });
  }
  const result = await pool.query(
    `INSERT INTO "Assignments" ("Id_Lesson", "Type", "Question", "Max_Score", "Answers", "Correct_Answer", "Created_At")
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
     RETURNING *`,
    [req.params.lessonId, Type, Question, Max_Score || null, Answers || null, Correct_Answer || null]
  );
  res.status(201).json({ success: true, data: mapAssignment(result.rows[0]) });
};

const updateAssignment = async (req, res) => {
  const current = await pool.query(`SELECT * FROM "Assignments" WHERE "Id_Assignment" = $1 LIMIT 1`, [req.params.id]);
  if (!current.rows[0]) return res.status(404).json({ success: false, message: "Задание не найдено" });
  const assignment = current.rows[0];
  const { Type, Question, Max_Score, Answers, Correct_Answer } = req.body;
  const result = await pool.query(
    `UPDATE "Assignments"
     SET "Type" = $1, "Question" = $2, "Max_Score" = $3, "Answers" = $4, "Correct_Answer" = $5
     WHERE "Id_Assignment" = $6
     RETURNING *`,
    [
      Type ?? assignment.Type,
      Question ?? assignment.Question,
      Max_Score ?? assignment.Max_Score,
      Answers ?? assignment.Answers,
      Correct_Answer ?? assignment.Correct_Answer,
      req.params.id,
    ]
  );
  res.json({ success: true, data: mapAssignment(result.rows[0]) });
};

const deleteAssignment = async (req, res) => {
  const result = await pool.query(`DELETE FROM "Assignments" WHERE "Id_Assignment" = $1 RETURNING "Id_Assignment"`, [
    req.params.id,
  ]);
  if (!result.rows[0]) return res.status(404).json({ success: false, message: "Задание не найдено" });
  res.json({ success: true, message: "Задание удалено" });
};

module.exports = { getLessonAssignments, createAssignment, updateAssignment, deleteAssignment };

