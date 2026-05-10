import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Save, Trash2 } from "lucide-react";
import { coursesApi } from "../api/coursesApi";
import { EmptyState, ErrorMessage, Loader, PageHeader } from "../components/ui";

const emptyCourse = {
  Title: "",
  Description: "",
  Price: "0",
  Course_type: "B",
  Duration_hours: 10,
  Difficulty_level: "B",
  Is_active: true,
};

const emptyModule = { Title: "", Description: "", Order_Num: 1 };
const emptyLesson = {
  moduleId: "",
  Title: "",
  Description: "",
  Content_Type: "text",
  Content_Url: "",
  Duration_Min: 20,
  Order_Num: 1,
  Is_Free: true,
};
const emptyAssignment = { lessonId: "", Type: "quiz", Question: "", Max_Score: 1, Correct_Answer: "" };
const emptyResource = { lessonId: "", File_Name: "", File_Url: "", File_Type: "link" };

function Field({ label, children }) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

const toCourseForm = (course) => ({
  Title: course.title || "",
  Description: course.description || "",
  Price: course.price || "0",
  Course_type: course.courseType || "B",
  Duration_hours: course.durationHours || 10,
  Difficulty_level: course.difficultyLevel || "B",
  Is_active: course.isActive !== false,
});

export default function AdminCourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [form, setForm] = useState(emptyCourse);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [moduleForm, setModuleForm] = useState(emptyModule);
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignment);
  const [resourceForm, setResourceForm] = useState(emptyResource);

  const lessons = useMemo(
    () => course?.modules?.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title }))) || [],
    [course]
  );

  const load = async () => {
    if (isNew) return;
    setLoading(true);
    setError("");
    try {
      const response = await coursesApi.getById(id);
      setCourse(response.data);
      setForm(toCourseForm(response.data));
    } catch {
      setError("Не удалось загрузить курс. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const runAction = async (action, message = "Изменения сохранены") => {
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(message);
      await load();
    } catch {
      setError("Не удалось сохранить изменения. Проверьте данные и попробуйте ещё раз.");
    }
  };

  const saveCourse = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (isNew) {
        const response = await coursesApi.create(form);
        navigate(`/admin/courses/${response.data.id}`);
      } else {
        await coursesApi.update(id, form);
        setSuccess("Курс сохранён");
        await load();
      }
    } catch {
      setError("Не удалось сохранить курс. Проверьте обязательные поля.");
    } finally {
      setSaving(false);
    }
  };

  const createModule = (event) => {
    event.preventDefault();
    runAction(async () => {
      await coursesApi.createModule(id, moduleForm);
      setModuleForm({ ...emptyModule, Order_Num: Number(moduleForm.Order_Num) + 1 });
    }, "Модуль добавлен");
  };

  const createLesson = (event) => {
    event.preventDefault();
    runAction(async () => {
      await coursesApi.createLesson(lessonForm.moduleId, lessonForm);
      setLessonForm({ ...emptyLesson, moduleId: lessonForm.moduleId, Order_Num: Number(lessonForm.Order_Num) + 1 });
    }, "Урок добавлен");
  };

  const createAssignment = (event) => {
    event.preventDefault();
    runAction(async () => {
      await coursesApi.createAssignment(assignmentForm.lessonId, assignmentForm);
      setAssignmentForm({ ...emptyAssignment, lessonId: assignmentForm.lessonId });
    }, "Задание добавлено");
  };

  const createResource = (event) => {
    event.preventDefault();
    runAction(async () => {
      await coursesApi.createResource(resourceForm.lessonId, resourceForm);
      setResourceForm({ ...emptyResource, lessonId: resourceForm.lessonId });
    }, "Ресурс добавлен");
  };

  const updateModule = (module) => runAction(
    () => coursesApi.updateModule(module.id, {
      Title: module.title,
      Description: module.description,
      Order_Num: module.orderNum,
    }),
    "Модуль сохранён"
  );

  const updateLesson = (lesson) => runAction(
    () => coursesApi.updateLesson(lesson.id, {
      Title: lesson.title,
      Description: lesson.description,
      Content_Type: lesson.contentType,
      Content_Url: lesson.contentUrl,
      Duration_Min: lesson.durationMin,
      Order_Num: lesson.orderNum,
      Is_Free: lesson.isFree,
    }),
    "Урок сохранён"
  );

  const updateAssignment = (assignment) => runAction(
    () => coursesApi.updateAssignment(assignment.id, {
      Type: assignment.type,
      Question: assignment.question,
      Max_Score: assignment.maxScore,
      Correct_Answer: assignment.correctAnswer,
    }),
    "Задание сохранено"
  );

  const removeWithConfirm = (question, action, message) => {
    if (!confirm(question)) return;
    runAction(action, message);
  };

  const updateModuleState = (moduleId, patch) => {
    setCourse((current) => ({
      ...current,
      modules: current.modules.map((module) => module.id === moduleId ? { ...module, ...patch } : module),
    }));
  };

  const updateLessonState = (moduleId, lessonId, patch) => {
    setCourse((current) => ({
      ...current,
      modules: current.modules.map((module) => module.id === moduleId
        ? { ...module, lessons: module.lessons.map((lesson) => lesson.id === lessonId ? { ...lesson, ...patch } : lesson) }
        : module),
    }));
  };

  const updateAssignmentState = (moduleId, lessonId, assignmentId, patch) => {
    setCourse((current) => ({
      ...current,
      modules: current.modules.map((module) => module.id === moduleId
        ? {
            ...module,
            lessons: module.lessons.map((lesson) => lesson.id === lessonId
              ? {
                  ...lesson,
                  assignments: lesson.assignments.map((assignment) =>
                    assignment.id === assignmentId ? { ...assignment, ...patch } : assignment
                  ),
                }
              : lesson),
          }
        : module),
    }));
  };

  if (loading) return <main className="page"><Loader text="Загружаем редактор курса..." /></main>;

  return (
    <main className="page admin-form-page">
      <PageHeader
        eyebrow="Редактор курса"
        title={isNew ? "Создание курса" : `Редактирование: ${course?.title || "курс"}`}
        text="Управляйте курсом, модулями, уроками, заданиями и ресурсами в одном месте."
        action={<Link className="button button--ghost" to="/admin/courses">К списку курсов</Link>}
      />

      {error && <ErrorMessage text={error} />}
      {success && <div className="success">{success}</div>}

      <form className="form-card wide admin-course-main" onSubmit={saveCourse}>
        <h2>Основная информация</h2>
        <input placeholder="Название курса" value={form.Title} onChange={(e) => setForm({ ...form, Title: e.target.value })} />
        <textarea placeholder="Описание курса" value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })} />
        <div className="form-grid">
          <input placeholder="Цена" value={form.Price} onChange={(e) => setForm({ ...form, Price: e.target.value })} />
          <input placeholder="Тип курса" value={form.Course_type} onChange={(e) => setForm({ ...form, Course_type: e.target.value })} />
          <input placeholder="Сложность" value={form.Difficulty_level} onChange={(e) => setForm({ ...form, Difficulty_level: e.target.value })} />
          <input placeholder="Длительность, часы" type="number" value={form.Duration_hours} onChange={(e) => setForm({ ...form, Duration_hours: Number(e.target.value) })} />
        </div>
        <label className="checkbox-line">
          <input type="checkbox" checked={form.Is_active} onChange={(e) => setForm({ ...form, Is_active: e.target.checked })} />
          Курс активен
        </label>
        <button className="button" disabled={saving}><Save size={18} /> {saving ? "Сохраняем..." : "Сохранить курс"}</button>
      </form>

      {!isNew && (
        <>
          <section className="admin-panels">
            <form className="mini-form" onSubmit={createModule}>
              <h2>Добавить модуль</h2>
              <input placeholder="Название" value={moduleForm.Title} onChange={(e) => setModuleForm({ ...moduleForm, Title: e.target.value })} />
              <input placeholder="Описание" value={moduleForm.Description} onChange={(e) => setModuleForm({ ...moduleForm, Description: e.target.value })} />
              <input type="number" value={moduleForm.Order_Num} onChange={(e) => setModuleForm({ ...moduleForm, Order_Num: Number(e.target.value) })} />
              <button className="button"><Plus size={18} /> Добавить модуль</button>
            </form>

            <form className="mini-form" onSubmit={createLesson}>
              <h2>Добавить урок</h2>
              <select value={lessonForm.moduleId} onChange={(e) => setLessonForm({ ...lessonForm, moduleId: e.target.value })}>
                <option value="">Выберите модуль</option>
                {course?.modules?.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
              </select>
              <input placeholder="Название" value={lessonForm.Title} onChange={(e) => setLessonForm({ ...lessonForm, Title: e.target.value })} />
              <textarea placeholder="Описание" value={lessonForm.Description} onChange={(e) => setLessonForm({ ...lessonForm, Description: e.target.value })} />
              <input placeholder="Тип контента" value={lessonForm.Content_Type} onChange={(e) => setLessonForm({ ...lessonForm, Content_Type: e.target.value })} />
              <input placeholder="URL материала" value={lessonForm.Content_Url} onChange={(e) => setLessonForm({ ...lessonForm, Content_Url: e.target.value })} />
              <button className="button"><Plus size={18} /> Добавить урок</button>
            </form>

            <form className="mini-form" onSubmit={createAssignment}>
              <h2>Добавить задание</h2>
              <select value={assignmentForm.lessonId} onChange={(e) => setAssignmentForm({ ...assignmentForm, lessonId: e.target.value })}>
                <option value="">Выберите урок</option>
                {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.moduleTitle}: {lesson.title}</option>)}
              </select>
              <input placeholder="Тип" value={assignmentForm.Type} onChange={(e) => setAssignmentForm({ ...assignmentForm, Type: e.target.value })} />
              <textarea placeholder="Вопрос" value={assignmentForm.Question} onChange={(e) => setAssignmentForm({ ...assignmentForm, Question: e.target.value })} />
              <input placeholder="Правильный ответ" value={assignmentForm.Correct_Answer} onChange={(e) => setAssignmentForm({ ...assignmentForm, Correct_Answer: e.target.value })} />
              <button className="button"><Plus size={18} /> Добавить задание</button>
            </form>

            <form className="mini-form" onSubmit={createResource}>
              <h2>Добавить ресурс</h2>
              <select value={resourceForm.lessonId} onChange={(e) => setResourceForm({ ...resourceForm, lessonId: e.target.value })}>
                <option value="">Выберите урок</option>
                {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.moduleTitle}: {lesson.title}</option>)}
              </select>
              <input placeholder="Название файла" value={resourceForm.File_Name} onChange={(e) => setResourceForm({ ...resourceForm, File_Name: e.target.value })} />
              <input placeholder="URL" value={resourceForm.File_Url} onChange={(e) => setResourceForm({ ...resourceForm, File_Url: e.target.value })} />
              <button className="button"><Plus size={18} /> Добавить ресурс</button>
            </form>
          </section>

          <section className="course-editor">
            <h2>Структура курса</h2>
            {!course?.modules?.length && <EmptyState title="Модулей пока нет" text="Добавьте первый модуль через форму выше." />}
            {course?.modules?.map((module) => (
              <article className="editor-module" key={module.id}>
                <div className="editor-row editor-row--module">
                  <Field label="Тема модуля">
                    <input value={module.title || ""} onChange={(e) => updateModuleState(module.id, { title: e.target.value })} />
                  </Field>
                  <Field label="Описание модуля">
                    <input value={module.description || ""} onChange={(e) => updateModuleState(module.id, { description: e.target.value })} />
                  </Field>
                  <Field label="Порядок">
                    <input type="number" value={module.orderNum || 1} onChange={(e) => updateModuleState(module.id, { orderNum: Number(e.target.value) })} />
                  </Field>
                  <button className="icon-button" onClick={() => updateModule(module)} title="Сохранить модуль"><Save size={18} /></button>
                  <button className="icon-button danger" onClick={() => removeWithConfirm("Удалить модуль?", () => coursesApi.removeModule(module.id), "Модуль удалён")} title="Удалить модуль"><Trash2 size={18} /></button>
                </div>

                {module.lessons.map((lesson) => (
                  <div className="editor-lesson" key={lesson.id}>
                    <div className="editor-row">
                      <Field label="Тема урока">
                        <input value={lesson.title || ""} onChange={(e) => updateLessonState(module.id, lesson.id, { title: e.target.value })} />
                      </Field>
                      <Field label="Тип контента">
                        <input value={lesson.contentType || "text"} onChange={(e) => updateLessonState(module.id, lesson.id, { contentType: e.target.value })} />
                      </Field>
                      <Field label="Минуты">
                        <input type="number" value={lesson.durationMin || 0} onChange={(e) => updateLessonState(module.id, lesson.id, { durationMin: Number(e.target.value) })} />
                      </Field>
                      <Field label="Порядок">
                        <input type="number" value={lesson.orderNum || 1} onChange={(e) => updateLessonState(module.id, lesson.id, { orderNum: Number(e.target.value) })} />
                      </Field>
                      <button className="icon-button" onClick={() => updateLesson(lesson)} title="Сохранить урок"><Save size={18} /></button>
                      <button className="icon-button danger" onClick={() => removeWithConfirm("Удалить урок?", () => coursesApi.removeLesson(lesson.id), "Урок удалён")} title="Удалить урок"><Trash2 size={18} /></button>
                    </div>
                    <Field label="Описание урока">
                      <textarea value={lesson.description || ""} onChange={(e) => updateLessonState(module.id, lesson.id, { description: e.target.value })} placeholder="Описание урока" />
                    </Field>
                    <Field label="Ссылка на материал">
                      <input value={lesson.contentUrl || ""} onChange={(e) => updateLessonState(module.id, lesson.id, { contentUrl: e.target.value })} placeholder="URL материала" />
                    </Field>

                    <div className="nested-editor">
                      <h4>Задания</h4>
                      {lesson.assignments?.length ? lesson.assignments.map((assignment) => (
                        <div className="editor-row" key={assignment.id}>
                          <Field label="Тип задания">
                            <input value={assignment.type || ""} onChange={(e) => updateAssignmentState(module.id, lesson.id, assignment.id, { type: e.target.value })} />
                          </Field>
                          <Field label="Вопрос">
                            <input value={assignment.question || ""} onChange={(e) => updateAssignmentState(module.id, lesson.id, assignment.id, { question: e.target.value })} />
                          </Field>
                          <Field label="Правильный ответ">
                            <input value={assignment.correctAnswer || ""} onChange={(e) => updateAssignmentState(module.id, lesson.id, assignment.id, { correctAnswer: e.target.value })} />
                          </Field>
                          <button className="icon-button" onClick={() => updateAssignment(assignment)} title="Сохранить задание"><Save size={18} /></button>
                          <button className="icon-button danger" onClick={() => removeWithConfirm("Удалить задание?", () => coursesApi.removeAssignment(assignment.id), "Задание удалено")} title="Удалить задание"><Trash2 size={18} /></button>
                        </div>
                      )) : <p className="muted">Заданий пока нет.</p>}
                    </div>

                    <div className="nested-editor">
                      <h4>Ресурсы</h4>
                      {lesson.resources?.length ? lesson.resources.map((resource) => (
                        <div className="editor-row" key={resource.id}>
                          <Field label="Название ресурса">
                            <input value={resource.fileName || ""} readOnly />
                          </Field>
                          <Field label="Ссылка на ресурс">
                            <input value={resource.fileUrl || ""} readOnly />
                          </Field>
                          <button className="icon-button danger" onClick={() => removeWithConfirm("Удалить ресурс?", () => coursesApi.removeResource(resource.id), "Ресурс удалён")} title="Удалить ресурс"><Trash2 size={18} /></button>
                        </div>
                      )) : <p className="muted">Ресурсов пока нет.</p>}
                    </div>
                  </div>
                ))}
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
