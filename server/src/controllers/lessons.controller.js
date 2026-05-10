const pool = require("../db/pool");
const { mapAssignment, mapLesson, mapResource } = require("../utils/courses");
const { checkLessonAccess } = require("../utils/lessonAccess");

const getModuleLessons = async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM "Lessons" WHERE "Id_Module" = $1 ORDER BY "Order_Num", "Id_Lesson"`,
    [req.params.moduleId]
  );
  res.json({ success: true, data: result.rows.map(mapLesson) });
};

const getLessonById = async (req, res) => {
  const access = await checkLessonAccess({ user: req.user, lessonId: req.params.id });

  if (!access.lesson) {
    return res.status(404).json({ success: false, message: "Урок не найден" });
  }

  if (!access.hasAccess) {
    return res.status(403).json({ error: "You do not have access to this lesson" });
  }

  const assignmentsResult = await pool.query(
    `SELECT * FROM "Assignments" WHERE "Id_Lesson" = $1 ORDER BY "Id_Assignment"`,
    [req.params.id]
  );
  const resourcesResult = await pool.query(
    `SELECT * FROM "Resources" WHERE "Id_Lesson" = $1 ORDER BY "Id_Resource"`,
    [req.params.id]
  );

  res.json({
    success: true,
    data: {
      ...mapLesson(access.lesson),
      courseId: access.lesson.Id_Course,
      assignments: assignmentsResult.rows.map(mapAssignment),
      resources: resourcesResult.rows.map(mapResource),
    },
  });
};

const createLesson = async (req, res) => {
  const { Title, Description, Content_Type, Content_Url, Duration_Min, Order_Num, Is_Free } = req.body;
  if (!Title || !Content_Type || Order_Num === undefined) {
    return res.status(400).json({ success: false, message: "Title, Content_Type и Order_Num обязательны" });
  }
  const result = await pool.query(
    `INSERT INTO "Lessons" (
       "Id_Module", "Title", "Description", "Content_Type", "Content_Url",
       "Duration_Min", "Order_Num", "Is_Free", "Created_At", "Updated_At"
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [
      req.params.moduleId,
      Title,
      Description || null,
      Content_Type,
      Content_Url || null,
      Duration_Min || null,
      Order_Num,
      Is_Free ?? false,
    ]
  );
  res.status(201).json({ success: true, data: mapLesson(result.rows[0]) });
};

const updateLesson = async (req, res) => {
  const current = await pool.query(`SELECT * FROM "Lessons" WHERE "Id_Lesson" = $1 LIMIT 1`, [req.params.id]);
  if (!current.rows[0]) return res.status(404).json({ success: false, message: "Урок не найден" });
  const lesson = current.rows[0];
  const { Title, Description, Content_Type, Content_Url, Duration_Min, Order_Num, Is_Free } = req.body;
  const result = await pool.query(
    `UPDATE "Lessons"
     SET "Title" = $1, "Description" = $2, "Content_Type" = $3, "Content_Url" = $4,
         "Duration_Min" = $5, "Order_Num" = $6, "Is_Free" = $7, "Updated_At" = CURRENT_TIMESTAMP
     WHERE "Id_Lesson" = $8
     RETURNING *`,
    [
      Title ?? lesson.Title,
      Description ?? lesson.Description,
      Content_Type ?? lesson.Content_Type,
      Content_Url ?? lesson.Content_Url,
      Duration_Min ?? lesson.Duration_Min,
      Order_Num ?? lesson.Order_Num,
      Is_Free ?? lesson.Is_Free,
      req.params.id,
    ]
  );
  res.json({ success: true, data: mapLesson(result.rows[0]) });
};

const deleteLesson = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM "Student_Progress" WHERE "Id_Lesson" = $1`, [req.params.id]);
    await client.query(`DELETE FROM "Assignments" WHERE "Id_Lesson" = $1`, [req.params.id]);
    await client.query(`DELETE FROM "Resources" WHERE "Id_Lesson" = $1`, [req.params.id]);
    const result = await client.query(`DELETE FROM "Lessons" WHERE "Id_Lesson" = $1 RETURNING "Id_Lesson"`, [
      req.params.id,
    ]);
    if (!result.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Урок не найден" });
    }
    await client.query("COMMIT");
    res.json({ success: true, message: "Урок удалён" });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { getModuleLessons, getLessonById, createLesson, updateLesson, deleteLesson };
