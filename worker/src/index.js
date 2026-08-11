const allowedStatuses = [
  "Open",
  "In Progress",
  "Blocked",
  "Completed"
];

const allowedPriorities = [
  "Low",
  "Medium",
  "High"
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: corsHeaders
  });
}

function validateTask(body) {
  const errors = [];

  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    errors.push("Title is required.");
  }

  if (body.status && !allowedStatuses.includes(body.status)) {
    errors.push("Invalid status.");
  }

  if (body.priority && !allowedPriorities.includes(body.priority)) {
    errors.push("Invalid priority.");
  }

  return errors;
}

function getTaskId(path) {
  const match = path.match(/^\/api\/tasks\/(\d+)$/);

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function getStatusTaskId(path) {
  const match = path.match(/^\/api\/tasks\/(\d+)\/status$/);

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

async function findTask(env, id) {
  return env.DB
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(id)
    .first();
}

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders
        });
      }

      const url = new URL(request.url);
      const path = url.pathname;

      // GET /api/tasks
      if (request.method === "GET" && path === "/api/tasks") {
        const result = await env.DB
          .prepare("SELECT * FROM tasks ORDER BY created_at DESC")
          .all();

        return json(result.results);
      }

      // GET /api/tasks/:id
      if (request.method === "GET") {
        const taskId = getTaskId(path);

        if (taskId !== null) {
          const task = await findTask(env, taskId);

          if (!task) {
            return json(
              { error: "Task not found." },
              404
            );
          }

          return json(task);
        }
      }

      // POST /api/tasks
      if (request.method === "POST" && path === "/api/tasks") {
        let body;

        try {
          body = await request.json();
        } catch {
          return json(
            { error: "Request body must be valid JSON." },
            400
          );
        }

        const errors = validateTask(body);

        if (errors.length > 0) {
          return json(
            {
              error: "Validation failed.",
              details: errors
            },
            400
          );
        }

        const now = new Date().toISOString();

        const result = await env.DB
          .prepare(
            `
            INSERT INTO tasks (
              title,
              description,
              assigned_employee,
              status,
              priority,
              due_date,
              created_at,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `
          )
          .bind(
            body.title.trim(),
            body.description || null,
            body.assigned_employee || null,
            body.status || "Open",
            body.priority || "Medium",
            body.due_date || null,
            now,
            now
          )
          .run();

        const task = await findTask(
          env,
          result.meta.last_row_id
        );

        return json(task, 201);
      }

      // PUT /api/tasks/:id
      if (request.method === "PUT") {
        const taskId = getTaskId(path);

        if (taskId !== null) {
          const existingTask = await findTask(env, taskId);

          if (!existingTask) {
            return json(
              { error: "Task not found." },
              404
            );
          }

          let body;

          try {
            body = await request.json();
          } catch {
            return json(
              { error: "Request body must be valid JSON." },
              400
            );
          }

          const errors = validateTask(body);

          if (errors.length > 0) {
            return json(
              {
                error: "Validation failed.",
                details: errors
              },
              400
            );
          }

          const now = new Date().toISOString();

          await env.DB
            .prepare(
              `
              UPDATE tasks
              SET
                title = ?,
                description = ?,
                assigned_employee = ?,
                status = ?,
                priority = ?,
                due_date = ?,
                updated_at = ?
              WHERE id = ?
              `
            )
            .bind(
              body.title.trim(),
              body.description || null,
              body.assigned_employee || null,
              body.status || "Open",
              body.priority || "Medium",
              body.due_date || null,
              now,
              taskId
            )
            .run();

          const updatedTask = await findTask(env, taskId);

          return json(updatedTask);
        }
      }

      // PATCH /api/tasks/:id/status
      if (request.method === "PATCH") {
        const taskId = getStatusTaskId(path);

        if (taskId !== null) {
          const existingTask = await findTask(env, taskId);

          if (!existingTask) {
            return json(
              { error: "Task not found." },
              404
            );
          }

          let body;

          try {
            body = await request.json();
          } catch {
            return json(
              { error: "Request body must be valid JSON." },
              400
            );
          }

          if (!allowedStatuses.includes(body.status)) {
            return json(
              { error: "Invalid status." },
              400
            );
          }

          const now = new Date().toISOString();

          await env.DB
            .prepare(
              `
              UPDATE tasks
              SET
                status = ?,
                updated_at = ?
              WHERE id = ?
              `
            )
            .bind(
              body.status,
              now,
              taskId
            )
            .run();

          const updatedTask = await findTask(env, taskId);

          return json(updatedTask);
        }
      }

      // DELETE /api/tasks/:id
      if (request.method === "DELETE") {
        const taskId = getTaskId(path);

        if (taskId !== null) {
          const existingTask = await findTask(env, taskId);

          if (!existingTask) {
            return json(
              { error: "Task not found." },
              404
            );
          }

          await env.DB
            .prepare("DELETE FROM tasks WHERE id = ?")
            .bind(taskId)
            .run();

          return json(
            { message: "Task deleted successfully." }
          );
        }
      }

      return json(
        { error: "Route not found." },
        404
      );
    } catch (error) {
      console.error(error);

      return json(
        { error: "Internal server error." },
        500
      );
    }
  }
};