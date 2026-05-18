# SkillFlow

SkillFlow - учебный веб-проект образовательной платформы для онлайн-курсов.

Проект состоит из двух частей:

- `client` - frontend на React + Vite
- `server` - backend API на Node.js + Express

Backend работает с уже существующей PostgreSQL базой данных и использует текущие таблицы: `Users`, `Roles`, `Courses`, `Modules`, `Lessons`, `Assignments`, `Resources`, `Student_Progress`, `Purchases`.

## Возможности

- регистрация и вход пользователей
- JWT-авторизация
- хранение паролей через bcrypt
- каталог курсов
- страница курса с модулями, уроками, заданиями и ресурсами
- личный кабинет
- мои курсы
- прохождение уроков
- сохранение прогресса в `Student_Progress`
- управление курсами, модулями, уроками, заданиями и ресурсами для администратора/ментора

## Структура

```text
skillflow/
  client/
  server/
  README.md
```

## Запуск backend

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

В файле `.env` нужно указать подключение к PostgreSQL:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@host/database
ACCESS_TOKEN_SECRET=your_access_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openrouter/free
```

Backend будет доступен по адресу:

```text
http://localhost:3000
```

## Запуск frontend

```bash
cd client
npm install
npm run dev
```

Frontend будет доступен по адресу:

```text
http://localhost:5173
```

## API

Основные группы маршрутов:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users/:id`
- `GET /api/courses`
- `GET /api/courses/:id`
- `POST /api/courses`
- `PUT /api/courses/:id`
- `DELETE /api/courses/:id`
- `GET /api/courses/:courseId/modules`
- `GET /api/modules/:id`
- `POST /api/courses/:courseId/modules`
- `PUT /api/modules/:id`
- `DELETE /api/modules/:id`
- `GET /api/modules/:moduleId/lessons`
- `GET /api/lessons/:id`
- `POST /api/modules/:moduleId/lessons`
- `PUT /api/lessons/:id`
- `DELETE /api/lessons/:id`
- `GET /api/lessons/:lessonId/assignments`
- `POST /api/lessons/:lessonId/assignments`
- `PUT /api/assignments/:id`
- `DELETE /api/assignments/:id`
- `GET /api/lessons/:lessonId/resources`
- `POST /api/lessons/:lessonId/resources`
- `DELETE /api/resources/:id`
- `GET /api/progress/me`
- `GET /api/progress/me/course/:courseId`
- `POST /api/progress/lesson/:lessonId/start`
- `POST /api/progress/lesson/:lessonId/complete`
- `PUT /api/progress/lesson/:lessonId`
- `GET /api/purchases/me`
- `POST /api/purchases`

## Роли

Роли берутся из таблицы `Roles`.

Для доступа к административным страницам frontend проверяет роль пользователя. Backend дополнительно защищает маршруты создания, обновления и удаления через `roleMiddleware`.

Поддерживаются роли:

- `Student`
- `Guest`
- `Mentor`
- `Admin`

## Прогресс обучения

Когда пользователь открывает урок, frontend вызывает:

```text
POST /api/progress/lesson/:lessonId/start
```

Backend создаёт или обновляет запись в `Student_Progress` со статусом `in_progress`.

Когда пользователь завершает урок, frontend вызывает:

```text
POST /api/progress/lesson/:lessonId/complete
```

Статус становится `completed`, а поле `Completed_at` заполняется текущей датой.

Процент прохождения курса считается как:

```text
завершенные уроки / все уроки курса * 100
```

## Безопасность

- SQL-запросы параметризованы
- пароли хранятся только как bcrypt-хэш
- `Password_hash` не возвращается в API-ответах
- защищённые маршруты требуют JWT
- административные действия требуют роль `Admin` или `Mentor`

## Security middleware

Backend использует минимальный набор middleware перед деплоем:

- `helmet()` добавляет базовые HTTP security headers.
- `express-rate-limit` ограничивает частоту запросов:
  - `POST /api/auth/login` и `POST /api/auth/register`: 10 запросов за 15 минут с одного IP.
  - `POST /api/ai-chat`: 20 запросов за 10 минут с одного IP.
  - остальные `/api` routes: 300 запросов за 15 минут с одного IP.
- `express.json({ limit: "20mb" })` ограничивает размер JSON body и позволяет сохранять аватар до 10 МБ в формате data URL.
- CORS разрешает `CLIENT_URL`; в development дополнительно разрешён `http://localhost:5173`.

## Database id generation

Для основных таблиц проекта (`Users`, `Courses`, `Modules`, `Lessons`, `Assignments`, `Resources`, `Student_Progress`, `Purchases`) в PostgreSQL должны использоваться `identity` или `sequence/default nextval` для primary key. Backend вставляет новые записи без ручной передачи `Id_*` и получает созданный id через `RETURNING`.

`server/src/utils/db.js` оставлен только как временный fallback для legacy-таблиц без sequence/default. Для production не рекомендуется использовать `MAX(id) + 1`; если появятся новые таблицы без автоинкремента, primary key нужно перевести на `GENERATED ... AS IDENTITY` или sequence/default `nextval`.

## Деплой

### Backend на Render

Настройки сервиса:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

Environment Variables:

- `PORT`
- `DATABASE_URL`
- `ACCESS_TOKEN_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`
- `AI_PROVIDER`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `NODE_ENV`

Рекомендуемые значения:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@host/database
ACCESS_TOKEN_SECRET=long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-name.vercel.app
AI_PROVIDER=openrouter
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openrouter/free
NODE_ENV=production
```

Backend использует `process.env.PORT || 3000`, `process.env.DATABASE_URL`, `process.env.CLIENT_URL` для CORS и `process.env.GROQ_API_KEY` только на сервере. Health-check доступен по адресу:

```text
GET /health
```

Ожидаемый ответ:

```json
{
  "status": "ok",
  "service": "SkillFlow API"
}
```

### Frontend на Vercel

Настройки проекта:

- Root Directory: `client`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Environment Variables:

- `VITE_API_URL`

Для production укажите URL backend:

```env
VITE_API_URL=https://your-backend-name.onrender.com
```

### Порядок деплоя

1. Загрузить проект на GitHub.
2. Задеплоить backend на Render.
3. Скопировать URL backend на Render.
4. Задеплоить frontend на Vercel.
5. Указать `VITE_API_URL` на Vercel, например `https://your-backend-name.onrender.com`.
6. Указать `CLIENT_URL` на Render, например `https://your-frontend-name.vercel.app`.
7. Перезапустить backend на Render.
8. Проверить `https://your-backend-name.onrender.com/health`.
9. Открыть сайт на Vercel и проверить регистрацию, вход, каталог курсов и AI chat.

### Важно перед публикацией

- Не добавлять `server/.env`, `client/.env`, `.env.local`, `node_modules` и `client/dist` в git.
- Не хранить `DATABASE_URL`, `GROQ_API_KEY`, `ACCESS_TOKEN_SECRET` и другие секреты во frontend.
- Для локального запуска используйте `client/.env.example` и `server/.env.example` как шаблон.
