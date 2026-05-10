require("dotenv").config();

const pool = require("../db/pool");

const COURSE_DESCRIPTION =
  "Практический курс для начинающих, который знакомит с HTML, CSS, JavaScript и принципами создания современных веб-сайтов. После прохождения курса студент сможет создать простую адаптивную страницу и понять, как работает frontend.";

const course = {
  title: "Основы веб-разработки",
  description: COURSE_DESCRIPTION,
  price: "0",
  courseType: "F",
  durationHours: 8,
  difficultyLevel: "Н",
};

const modules = [
  {
    title: "Введение в веб-разработку",
    description:
      "Разберём, как устроен интернет, из чего состоит сайт и какие технологии используются во frontend-разработке.",
    lessons: [
      {
        title: "Что такое сайт и как он работает",
        description:
          "Простое объяснение сайта, frontend, backend, браузера и клиент-серверной архитектуры.",
        contentUrl: "/course-materials/web-basics/lesson-1-1.md",
        durationMin: 20,
        isFree: true,
        assignment: {
          type: "quiz",
          question: "Что отвечает за внешний вид и взаимодействие пользователя с сайтом?",
          answers: ["Frontend", "Backend", "База данных", "Хостинг"],
          correctAnswer: "Frontend",
          maxScore: 10,
        },
        resource: {
          fileName: "Схема клиент-серверной архитектуры",
          fileUrl:
            "https://developer.mozilla.org/ru/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work",
          fileType: "link",
        },
      },
      {
        title: "Инструменты разработчика",
        description: "Редактор кода, VS Code, браузер, DevTools, терминал и базовое понимание Git.",
        contentUrl: "/course-materials/web-basics/lesson-1-2.md",
        durationMin: 25,
        isFree: true,
        assignment: {
          type: "short_answer",
          question: "Для чего нужны DevTools в браузере?",
          answers: null,
          correctAnswer: "Для просмотра и отладки HTML, CSS, JavaScript и сетевых запросов",
          maxScore: 10,
        },
        resource: {
          fileName: "Chrome DevTools",
          fileUrl: "https://developer.chrome.com/docs/devtools",
          fileType: "link",
        },
      },
    ],
  },
  {
    title: "HTML — структура страницы",
    description: "Научимся создавать структуру веб-страницы с помощью HTML.",
    lessons: [
      {
        title: "Основные HTML-теги",
        description: "HTML-документ, теги, списки, ссылки, изображения и семантическая разметка.",
        contentUrl: "/course-materials/web-basics/lesson-2-1.md",
        durationMin: 35,
        isFree: true,
        assignment: {
          type: "practice",
          question: "Создай HTML-страницу о себе: добавь заголовок, абзац, список интересов и ссылку.",
          answers: null,
          correctAnswer: "Страница должна содержать h1, p, ul/li и a",
          maxScore: 20,
        },
        resource: {
          fileName: "HTML для начинающих",
          fileUrl: "https://developer.mozilla.org/ru/docs/Learn/HTML/Introduction_to_HTML",
          fileType: "link",
        },
      },
      {
        title: "Формы и поля ввода",
        description: "Формы регистрации, поля ввода, label, textarea, select и button.",
        contentUrl: "/course-materials/web-basics/lesson-2-2.md",
        durationMin: 30,
        isFree: false,
        assignment: {
          type: "practice",
          question: "Создай HTML-форму регистрации с полями имя, email, пароль и кнопкой отправки.",
          answers: null,
          correctAnswer:
            "Форма должна содержать form, label, input type='email', input type='password' и button",
          maxScore: 20,
        },
        resource: {
          fileName: "HTML forms",
          fileUrl: "https://developer.mozilla.org/ru/docs/Learn/Forms",
          fileType: "link",
        },
      },
    ],
  },
  {
    title: "CSS — внешний вид сайта",
    description: "Изучим основы CSS и научимся оформлять веб-страницы.",
    lessons: [
      {
        title: "Основы CSS",
        description: "Селекторы, свойства, цвета, размеры, отступы, рамки, фон и скругления.",
        contentUrl: "/course-materials/web-basics/lesson-3-1.md",
        durationMin: 40,
        isFree: false,
        assignment: {
          type: "quiz",
          question: "Какое CSS-свойство отвечает за внутренний отступ элемента?",
          answers: ["padding", "margin", "border", "display"],
          correctAnswer: "padding",
          maxScore: 10,
        },
        resource: {
          fileName: "CSS basics",
          fileUrl: "https://developer.mozilla.org/ru/docs/Learn/Getting_started_with_the_web/CSS_basics",
          fileType: "link",
        },
      },
      {
        title: "Flexbox и адаптивность",
        description: "Flexbox, выравнивание, перенос элементов, gap и media queries.",
        contentUrl: "/course-materials/web-basics/lesson-3-2.md",
        durationMin: 45,
        isFree: false,
        assignment: {
          type: "practice",
          question: "Сделай адаптивную сетку карточек: на desktop 3 карточки в ряд, на mobile 1 карточка в ряд.",
          answers: null,
          correctAnswer: "Использовать flex или grid и media query",
          maxScore: 20,
        },
        resource: {
          fileName: "Flexbox guide",
          fileUrl: "https://developer.mozilla.org/ru/docs/Learn/CSS/CSS_layout/Flexbox",
          fileType: "link",
        },
      },
    ],
  },
  {
    title: "JavaScript — интерактивность",
    description: "Добавим интерактивность на страницу с помощью JavaScript.",
    lessons: [
      {
        title: "Основы JavaScript",
        description: "Переменные, типы данных, условия, функции, события и console.log.",
        contentUrl: "/course-materials/web-basics/lesson-4-1.md",
        durationMin: 45,
        isFree: false,
        assignment: {
          type: "quiz",
          question: "Какой метод позволяет вывести сообщение в консоль?",
          answers: ["console.log", "document.querySelector", "alert.close", "event.click"],
          correctAnswer: "console.log",
          maxScore: 10,
        },
        resource: {
          fileName: "JavaScript basics",
          fileUrl:
            "https://developer.mozilla.org/ru/docs/Learn/Getting_started_with_the_web/JavaScript_basics",
          fileType: "link",
        },
      },
      {
        title: "Итоговый мини-проект",
        description: "Создание адаптивной landing page для вымышленного онлайн-курса.",
        contentUrl: "/course-materials/web-basics/lesson-4-2.md",
        durationMin: 60,
        isFree: false,
        assignment: {
          type: "practice",
          question:
            "Создай итоговый мини-проект: адаптивную landing page для онлайн-курса с HTML, CSS и JavaScript.",
          answers: null,
          correctAnswer:
            "Проект должен содержать HTML-структуру, CSS-оформление, адаптивность и хотя бы одно JS-событие",
          maxScore: 50,
        },
        resource: {
          fileName: "Frontend learning area",
          fileUrl: "https://developer.mozilla.org/ru/docs/Learn/Front-end_web_developer",
          fileType: "link",
        },
      },
    ],
  },
];

const seedDemoCourse = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Title can be stored in a short fixed-width column in the existing DB,
    // so exact idempotency relies on the full unique course description.
    await client.query(`SELECT "Id_Course" FROM "Courses" WHERE "Title" = $1 LIMIT 1`, [course.title]);
    const existingCourse = await client.query(
      `SELECT "Id_Course" FROM "Courses" WHERE "Description" = $1 LIMIT 1`,
      [course.description]
    );

    if (existingCourse.rows[0]) {
      await client.query("COMMIT");
      console.log("Demo course already exists");
      return;
    }

    const courseResult = await client.query(
      `INSERT INTO "Courses" (
         "Title", "Description", "Price", "Course_type",
         "Duration_hours", "Difficulty_level", "Is_active", "Created_at", "Updated_at"
       )
       VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING "Id_Course"`,
      [
        course.title,
        course.description,
        course.price,
        course.courseType,
        course.durationHours,
        course.difficultyLevel,
      ]
    );

    const createdCourseId = courseResult.rows[0].Id_Course;

    for (const [moduleIndex, moduleItem] of modules.entries()) {
      const moduleResult = await client.query(
        `INSERT INTO "Modules" (
           "Id_Course", "Title", "Description", "Order_Num", "Created_At", "Updated_At"
         )
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING "Id_Module"`,
        [createdCourseId, moduleItem.title, moduleItem.description, moduleIndex + 1]
      );

      const moduleId = moduleResult.rows[0].Id_Module;

      for (const [lessonIndex, lesson] of moduleItem.lessons.entries()) {
        const lessonResult = await client.query(
          `INSERT INTO "Lessons" (
             "Id_Module", "Title", "Description", "Content_Type", "Content_Url",
             "Duration_Min", "Order_Num", "Is_Free", "Created_At", "Updated_At"
           )
           VALUES ($1, $2, $3, 'text', $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING "Id_Lesson"`,
          [
            moduleId,
            lesson.title,
            lesson.description,
            lesson.contentUrl,
            lesson.durationMin,
            lessonIndex + 1,
            lesson.isFree,
          ]
        );

        const lessonId = lessonResult.rows[0].Id_Lesson;
        await client.query(
          `INSERT INTO "Assignments" (
             "Id_Lesson", "Type", "Question", "Max_Score", "Answers", "Correct_Answer", "Created_At"
           )
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
          [
            lessonId,
            lesson.assignment.type,
            lesson.assignment.question,
            lesson.assignment.maxScore,
            lesson.assignment.answers ? JSON.stringify(lesson.assignment.answers) : null,
            lesson.assignment.correctAnswer,
          ]
        );

        await client.query(
          `INSERT INTO "Resources" ("Id_Lesson", "File_Name", "File_Url", "File_Type", "Uploaded_At")
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [lessonId, lesson.resource.fileName, lesson.resource.fileUrl, lesson.resource.fileType]
        );
      }
    }

    await client.query("COMMIT");
    console.log("Demo course created successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed demo course:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

seedDemoCourse();
