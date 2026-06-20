# 3205Test

Full-stack приложение для асинхронной проверки списка URL.

- `frontend` - React + TypeScript + Vite + Zustand
- `backend` - NestJS + TypeScript + BullMQ
- `redis` - очередь BullMQ

## Запуск через Docker

Требования:

- Docker
- Docker Compose

Запуск:

```bash
docker compose up --build
```

Адреса:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Redis: localhost:6379

Остановка:

```bash
docker compose down
```

## Локальный запуск

Для локального backend нужен Redis. Можно поднять только Redis через Docker:

```bash
docker compose up -d redis
```

Backend:

```bash
cd backend
npm install
npm run start:dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Локальные адреса:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## API

Создать задание:

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H 'Content-Type: application/json' \
  -d '{"urls":["https://example.com","https://github.com"]}'
```

Список заданий:

```bash
curl http://localhost:3000/api/jobs
```

Детали задания:

```bash
curl http://localhost:3000/api/jobs/<jobId>
```

Отмена задания:

```bash
curl -X DELETE http://localhost:3000/api/jobs/<jobId>
```

Health check:

```bash
curl http://localhost:3000/health
```

## Postman Collection

Импорт: Postman -> Import -> Raw text -> вставить JSON ниже.

```json
{
  "info": {
    "name": "URL Checker API",
    "_postman_id": "7e2f68c4-33a7-4a95-b2e5-url-checker",
    "description": "REST API для создания, просмотра и отмены асинхронных заданий проверки URL через BullMQ.",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "jobId",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/health",
          "host": ["{{baseUrl}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Create Job",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "const json = pm.response.json();",
              "if (json.jobId) {",
              "  pm.collectionVariables.set('jobId', json.jobId);",
              "}"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"urls\": [\n    \"https://example.com\",\n    \"https://github.com\",\n    \"https://google.com\"\n  ]\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/jobs",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs"]
        }
      }
    },
    {
      "name": "List Jobs",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/jobs",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs"]
        }
      }
    },
    {
      "name": "Get Job Details",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/jobs/{{jobId}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs", "{{jobId}}"]
        }
      }
    },
    {
      "name": "Cancel Job",
      "request": {
        "method": "DELETE",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/jobs/{{jobId}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs", "{{jobId}}"]
        }
      }
    }
  ]
}
```
