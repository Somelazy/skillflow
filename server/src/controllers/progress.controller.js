const pool = require("../db/pool");
const { checkLessonAccess } = require("../utils/lessonAccess");

const verifyProgressLessonAccess = async (req, res) => {
  const access = await checkLessonAccess({ user: req.user, lessonId: req.params.lessonId });

  if (!access.lesson) {
    res.status(404).json({ success: false, message: "Урок не найден" });
    return false;
  }

  if (!access.hasAccess) {
    res.status(403).json({ error: "You do not have access to this lesson" });
    return false;
  }

  return true;
};

const getUserProgress = async (req, res) => {
  const result = await pool.query(
    `SELECT sp.*, l."Title" AS lesson_title, m."Id_Course", c."Title" AS course_title
     FROM "Student_Progress" sp
     JOIN "Lessons" l ON l."Id_Lesson" = sp."Id_Lesson"
     JOIN "Modules" m ON m."Id_Module" = l."Id_Module"
     JOIN "Courses" c ON c."Id_Course" = m."Id_Course"
     WHERE sp."Id_User" = $1
     ORDER BY sp."Last_Accessed" DESC NULLS LAST`,
    [req.user.Id_User]
  );
  res.json({ success: true, data: result.rows });
};

const getCourseProgress = async (req, res) => {
  const lessonResult = await pool.query(
    `SELECT l."Id_Lesson", l."Title", l."Order_Num", m."Order_Num" AS module_order
     FROM "Lessons" l
     JOIN "Modules" m ON m."Id_Module" = l."Id_Module"
     WHERE m."Id_Course" = $1
     ORDER BY m."Order_Num", l."Order_Num", l."Id_Lesson"`,
    [req.params.courseId]
  );

  const lessonIds = lessonResult.rows.map((lesson) => lesson.Id_Lesson);
  let progressRows = [];

  if (lessonIds.length) {
    const progressResult = await pool.query(
      `SELECT *
       FROM "Student_Progress"
       WHERE "Id_User" = $1 AND "Id_Lesson" = ANY($2::int[])
       ORDER BY "Last_Accessed" DESC NULLS LAST`,
      [req.user.Id_User, lessonIds]
    );
    progressRows = progressResult.rows;
  }

  const progressByLesson = new Map();
  progressRows.forEach((item) => {
    if (!progressByLesson.has(item.Id_Lesson)) progressByLesson.set(item.Id_Lesson, item);
  });

  const lessons = lessonResult.rows.map((lesson) => {
    const progress = progressByLesson.get(lesson.Id_Lesson);
    return {
      lessonId: lesson.Id_Lesson,
      title: lesson.Title,
      status: progress?.Status || "not_started",
      score: progress?.Score ?? null,
      startedAt: progress?.Started_at || null,
      completedAt: progress?.Completed_at || null,
      lastAccessed: progress?.Last_Accessed || null,
    };
  });

  const completedLessons = lessons.filter((lesson) => lesson.status === "completed").length;
  const totalLessons = lessons.length;
  const completionPercent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  res.json({
    success: true,
    data: {
      lessons,
      stats: { completedLessons, totalLessons, completionPercent },
    },
  });
};

const ensureProgress = async ({ userId, lessonId, status, score }) => {
  const existing = await pool.query(
    `SELECT * FROM "Student_Progress"
     WHERE "Id_User" = $1::int AND "Id_Lesson" = $2::int
     ORDER BY "Id_Progress" DESC
     LIMIT 1`,
    [userId, lessonId]
  );

  if (existing.rows[0]) {
    const current = existing.rows[0];
    const result = await pool.query(
      `UPDATE "Student_Progress"
       SET "Status" = $1::varchar,
           "Score" = $2,
           "Started_at" = COALESCE("Started_at", NOW()),
           "Completed_at" = CASE WHEN $1::varchar = 'completed' THEN NOW() ELSE "Completed_at" END,
           "Last_Accessed" = NOW()
       WHERE "Id_Progress" = $3::int
       RETURNING *`,
      [status, score ?? current.Score, current.Id_Progress]
    );
    return result.rows[0];
  }

  const result = await pool.query(
    `INSERT INTO "Student_Progress" (
       "Id_User", "Id_Lesson", "Status", "Score", "Started_at", "Completed_at", "Last_Accessed"
     )
     VALUES ($1::int, $2::int, $3::varchar, $4, NOW(), CASE WHEN $3::varchar = 'completed' THEN NOW() ELSE NULL END, NOW())
     RETURNING *`,
    [userId, lessonId, status, score ?? null]
  );
  return result.rows[0];
};

const startLesson = async (req, res) => {
  if (!(await verifyProgressLessonAccess(req, res))) return;

  const saved = await ensureProgress({
    userId: req.user.Id_User,
    lessonId: req.params.lessonId,
    status: "in_progress",
  });
  res.json({ success: true, data: saved });
};

const completeLesson = async (req, res) => {
  if (!(await verifyProgressLessonAccess(req, res))) return;

  const saved = await ensureProgress({
    userId: req.user.Id_User,
    lessonId: req.params.lessonId,
    status: "completed",
    score: req.body.score,
  });
  res.json({ success: true, data: saved });
};

const updateLessonProgress = async (req, res) => {
  const { Status, Score } = req.body;
  if (!["not_started", "in_progress", "completed"].includes(Status)) {
    return res.status(400).json({ success: false, message: "Некорректный статус прогресса" });
  }
  if (!(await verifyProgressLessonAccess(req, res))) return;

  const saved = await ensureProgress({
    userId: req.user.Id_User,
    lessonId: req.params.lessonId,
    status: Status,
    score: Score,
  });
  res.json({ success: true, data: saved });
};

module.exports = { getUserProgress, getCourseProgress, startLesson, completeLesson, updateLessonProgress };
