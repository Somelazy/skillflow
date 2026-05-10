const titleFallbacks = {
  1: "Python для начинающих",
  2: "Django веб-разработка",
  3: "Английский для специалистов",
  4: "Основы UI/UX дизайна",
  5: "Введение в Machine Learning",
  6: "SQL и базы данных",
  7: "JavaScript и DOM",
};

const webBasicsDescription =
  "Практический курс для начинающих, который знакомит с HTML, CSS, JavaScript и принципами создания современных веб-сайтов. После прохождения курса студент сможет создать простую адаптивную страницу и понять, как работает frontend.";

const isWebBasicsCourse = (course) => course.Description === webBasicsDescription;

const normalizeTitle = (course) => {
  if (isWebBasicsCourse(course)) {
    return "Основы веб-разработки";
  }

  const title = typeof course.Title === "string" ? course.Title.trim() : "";
  if (!title || title === "\\320" || /^\\320/.test(title)) {
    return titleFallbacks[course.Id_Course] || `Курс #${course.Id_Course}`;
  }
  return title;
};

const normalizeCourseType = (course) => {
  if (isWebBasicsCourse(course)) {
    return "Frontend";
  }

  const value = typeof course.Course_type === "string" ? course.Course_type.trim() : course.Course_type;
  return { F: "Frontend" }[value] || value;
};

const normalizeDifficultyLevel = (course) => {
  if (isWebBasicsCourse(course)) {
    return "Начальный";
  }

  const value =
    typeof course.Difficulty_level === "string"
      ? course.Difficulty_level.trim()
      : course.Difficulty_level;
  return { Н: "Начальный" }[value] || value;
};

const mapCourse = (course) => ({
  id: course.Id_Course,
  title: normalizeTitle(course),
  description: course.Description,
  price: course.Price,
  courseType: normalizeCourseType(course),
  durationHours: course.Duration_hours,
  difficultyLevel: normalizeDifficultyLevel(course),
  isActive: course.Is_active,
  createdAt: course.Created_at,
  updatedAt: course.Updated_at,
});

const mapModule = (module) => ({
  id: module.Id_Module,
  courseId: module.Id_Course,
  title: module.Title,
  description: module.Description,
  orderNum: module.Order_Num,
  createdAt: module.Created_At,
  updatedAt: module.Updated_At,
});

const mapLesson = (lesson) => ({
  id: lesson.Id_Lesson,
  moduleId: lesson.Id_Module,
  title: lesson.Title,
  description: lesson.Description,
  contentType: lesson.Content_Type,
  contentUrl: lesson.Content_Url,
  durationMin: lesson.Duration_Min,
  orderNum: lesson.Order_Num,
  isFree: lesson.Is_Free,
  createdAt: lesson.Created_At,
  updatedAt: lesson.Updated_At,
});

const mapAssignment = (assignment) => ({
  id: assignment.Id_Assignment,
  lessonId: assignment.Id_Lesson,
  type: assignment.Type,
  question: assignment.Question,
  maxScore: assignment.Max_Score,
  answers: assignment.Answers,
  correctAnswer: assignment.Correct_Answer,
  createdAt: assignment.Created_At,
});

const mapResource = (resource) => ({
  id: resource.Id_Resource,
  lessonId: resource.Id_Lesson,
  fileName: resource.File_Name,
  fileUrl: resource.File_Url,
  fileType: resource.File_Type,
  uploadedAt: resource.Uploaded_At,
});

module.exports = { mapCourse, mapModule, mapLesson, mapAssignment, mapResource };
