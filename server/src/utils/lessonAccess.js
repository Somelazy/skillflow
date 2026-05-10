const pool = require("../db/pool");

const paidStatuses = ["paid", "completed", "success", "p"];

const isPrivilegedUser = (user) =>
  ["Admin", "Mentor"].includes(user?.Role) || [4, 3].includes(Number(user?.Id_role));

const getLessonWithCourse = async (lessonId) => {
  const result = await pool.query(
    `SELECT l.*, m."Id_Course"
     FROM "Lessons" l
     JOIN "Modules" m ON m."Id_Module" = l."Id_Module"
     WHERE l."Id_Lesson" = $1
     LIMIT 1`,
    [lessonId]
  );

  return result.rows[0] || null;
};

const hasCoursePurchase = async ({ userId, courseId }) => {
  const result = await pool.query(
    `SELECT "Id_Purchase"
     FROM "Purchases"
     WHERE "Id_user" = $1
       AND "Id_course" = $2
       AND LOWER(TRIM(COALESCE("Payment_status", ''))) = ANY($3::text[])
     LIMIT 1`,
    [userId, courseId, paidStatuses]
  );

  return Boolean(result.rows[0]);
};

const checkLessonAccess = async ({ user, lessonId }) => {
  const lesson = await getLessonWithCourse(lessonId);

  if (!lesson) {
    return { lesson: null, hasAccess: false };
  }

  if (lesson.Is_Free === true || isPrivilegedUser(user)) {
    return { lesson, hasAccess: true };
  }

  const hasPurchase = await hasCoursePurchase({
    userId: user.Id_User,
    courseId: lesson.Id_Course,
  });

  return { lesson, hasAccess: hasPurchase };
};

module.exports = { checkLessonAccess };
