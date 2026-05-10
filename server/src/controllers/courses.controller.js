const pool = require("../db/pool");
const { mapCourse, mapModule, mapLesson, mapAssignment, mapResource } = require("../utils/courses");

const getCourses = async (req, res) => {
  const result = await pool.query(
    `SELECT c.*,
            COUNT(DISTINCT m."Id_Module")::int AS module_count,
            COUNT(DISTINCT l."Id_Lesson")::int AS lesson_count
     FROM "Courses" c
     LEFT JOIN "Modules" m ON m."Id_Course" = c."Id_Course"
     LEFT JOIN "Lessons" l ON l."Id_Module" = m."Id_Module"
     GROUP BY c."Id_Course"
     ORDER BY COALESCE(c."Is_active", true) DESC, c."Id_Course" ASC`
  );

  res.json({
    success: true,
    data: result.rows.map((row) => ({
      ...mapCourse(row),
      moduleCount: row.module_count,
      lessonCount: row.lesson_count,
    })),
  });
};

const getCourseById = async (req, res) => {
  const courseResult = await pool.query(`SELECT * FROM "Courses" WHERE "Id_Course" = $1 LIMIT 1`, [
    req.params.id,
  ]);
  const course = courseResult.rows[0];

  if (!course) {
    return res.status(404).json({ success: false, message: "Курс не найден" });
  }

  const modulesResult = await pool.query(
    `SELECT * FROM "Modules" WHERE "Id_Course" = $1 ORDER BY "Order_Num", "Id_Module"`,
    [req.params.id]
  );

  const moduleIds = modulesResult.rows.map((item) => item.Id_Module);
  let lessons = [];
  let assignments = [];
  let resources = [];

  if (moduleIds.length) {
    const lessonsResult = await pool.query(
      `SELECT * FROM "Lessons"
       WHERE "Id_Module" = ANY($1::int[])
       ORDER BY "Id_Module", "Order_Num", "Id_Lesson"`,
      [moduleIds]
    );
    lessons = lessonsResult.rows;

    const lessonIds = lessons.map((lesson) => lesson.Id_Lesson);
    if (lessonIds.length) {
      const assignmentsResult = await pool.query(
        `SELECT * FROM "Assignments" WHERE "Id_Lesson" = ANY($1::int[]) ORDER BY "Id_Assignment"`,
        [lessonIds]
      );
      const resourcesResult = await pool.query(
        `SELECT * FROM "Resources" WHERE "Id_Lesson" = ANY($1::int[]) ORDER BY "Id_Resource"`,
        [lessonIds]
      );
      assignments = assignmentsResult.rows;
      resources = resourcesResult.rows;
    }
  }

  const assignmentsByLesson = new Map();
  assignments.forEach((item) => {
    const list = assignmentsByLesson.get(item.Id_Lesson) || [];
    list.push(mapAssignment(item));
    assignmentsByLesson.set(item.Id_Lesson, list);
  });

  const resourcesByLesson = new Map();
  resources.forEach((item) => {
    const list = resourcesByLesson.get(item.Id_Lesson) || [];
    list.push(mapResource(item));
    resourcesByLesson.set(item.Id_Lesson, list);
  });

  const lessonsByModule = new Map();
  lessons.forEach((item) => {
    const list = lessonsByModule.get(item.Id_Module) || [];
    list.push({
      ...mapLesson(item),
      assignments: assignmentsByLesson.get(item.Id_Lesson) || [],
      resources: resourcesByLesson.get(item.Id_Lesson) || [],
    });
    lessonsByModule.set(item.Id_Module, list);
  });

  const modules = modulesResult.rows.map((item) => ({
    ...mapModule(item),
    lessons: lessonsByModule.get(item.Id_Module) || [],
  }));

  res.json({
    success: true,
    data: {
      ...mapCourse(course),
      modules,
      stats: {
        moduleCount: modules.length,
        lessonCount: lessons.length,
        assignmentCount: assignments.length,
        resourceCount: resources.length,
      },
    },
  });
};

const createCourse = async (req, res) => {
  const { Title, Description, Price, Course_type, Duration_hours, Difficulty_level, Is_active } = req.body;

  if (!Title || Price === undefined || !Course_type || !Difficulty_level) {
    return res.status(400).json({ success: false, message: "Title, Price, Course_type и Difficulty_level обязательны" });
  }

  const result = await pool.query(
    `INSERT INTO "Courses" (
       "Title", "Description", "Price", "Course_type",
       "Duration_hours", "Difficulty_level", "Is_active", "Created_at", "Updated_at"
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [Title, Description || null, String(Price), Course_type, Duration_hours || null, Difficulty_level, Is_active ?? true]
  );

  res.status(201).json({ success: true, data: mapCourse(result.rows[0]) });
};

const updateCourse = async (req, res) => {
  const current = await pool.query(`SELECT * FROM "Courses" WHERE "Id_Course" = $1 LIMIT 1`, [req.params.id]);
  if (!current.rows[0]) {
    return res.status(404).json({ success: false, message: "Курс не найден" });
  }

  const course = current.rows[0];
  const { Title, Description, Price, Course_type, Duration_hours, Difficulty_level, Is_active } = req.body;

  const result = await pool.query(
    `UPDATE "Courses"
     SET "Title" = $1, "Description" = $2, "Price" = $3, "Course_type" = $4,
         "Duration_hours" = $5, "Difficulty_level" = $6, "Is_active" = $7,
         "Updated_at" = CURRENT_TIMESTAMP
     WHERE "Id_Course" = $8
     RETURNING *`,
    [
      Title ?? course.Title,
      Description ?? course.Description,
      Price === undefined ? course.Price : String(Price),
      Course_type ?? course.Course_type,
      Duration_hours ?? course.Duration_hours,
      Difficulty_level ?? course.Difficulty_level,
      Is_active ?? course.Is_active,
      req.params.id,
    ]
  );

  res.json({ success: true, data: mapCourse(result.rows[0]) });
};

const deleteCourse = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const lessonResult = await client.query(
      `SELECT l."Id_Lesson"
       FROM "Lessons" l
       JOIN "Modules" m ON m."Id_Module" = l."Id_Module"
       WHERE m."Id_Course" = $1`,
      [req.params.id]
    );
    const lessonIds = lessonResult.rows.map((lesson) => lesson.Id_Lesson);

    if (lessonIds.length) {
      await client.query(`DELETE FROM "Student_Progress" WHERE "Id_Lesson" = ANY($1::int[])`, [lessonIds]);
      await client.query(`DELETE FROM "Assignments" WHERE "Id_Lesson" = ANY($1::int[])`, [lessonIds]);
      await client.query(`DELETE FROM "Resources" WHERE "Id_Lesson" = ANY($1::int[])`, [lessonIds]);
    }

    await client.query(
      `DELETE FROM "Lessons"
       WHERE "Id_Module" IN (SELECT "Id_Module" FROM "Modules" WHERE "Id_Course" = $1)`,
      [req.params.id]
    );
    await client.query(`DELETE FROM "Modules" WHERE "Id_Course" = $1`, [req.params.id]);
    const result = await client.query(`DELETE FROM "Courses" WHERE "Id_Course" = $1 RETURNING "Id_Course"`, [
      req.params.id,
    ]);

    if (!result.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Курс не найден" });
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Курс удалён" });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse };
