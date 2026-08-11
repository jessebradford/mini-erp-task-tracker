const API_BASE_URL =
  "https://mini-erp-task-tracker-api.jessebradford10.workers.dev";

const form = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const message = document.getElementById("message");
const statusFilter = document.getElementById("status-filter");

let tasks = [];
let editingTaskId = null;

document.addEventListener("DOMContentLoaded", loadTasks);

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const formData = new FormData(form);

  const taskData = {
    title: formData.get("title"),
    description: formData.get("description"),
    assigned_employee: formData.get("assigned_employee"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    due_date: formData.get("due_date")
  };

  try {
    setMessage("Saving task...");

    if (editingTaskId !== null) {
      await updateTask(editingTaskId, taskData);
      editingTaskId = null;
    } else {
      await createTask(taskData);
    }

    form.reset();

    await loadTasks();

    setMessage("Task saved successfully.");
  } catch (error) {
    console.error(error);
    setMessage(error.message, true);
  }
});

statusFilter.addEventListener("change", function () {
  renderTasks();
});

async function loadTasks() {
  try {
    setMessage("Loading tasks...");

    const response = await fetch(`${API_BASE_URL}/api/tasks`);

    if (!response.ok) {
      throw new Error("Could not load tasks.");
    }

    tasks = await response.json();

    renderTasks();
  } catch (error) {
    console.error(error);
    setMessage(error.message, true);
  }
}

async function createTask(taskData) {
  const response = await fetch(`${API_BASE_URL}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(taskData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not create task.");
  }

  return data;
}

async function updateTask(taskId, taskData) {
  const response = await fetch(
    `${API_BASE_URL}/api/tasks/${taskId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(taskData)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not update task.");
  }

  return data;
}

async function completeTask(taskId) {
  try {
    setMessage("Updating task...");

    const response = await fetch(
      `${API_BASE_URL}/api/tasks/${taskId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "Completed"
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not complete task.");
    }

    await loadTasks();

    setMessage("Task marked as completed.");
  } catch (error) {
    console.error(error);
    setMessage(error.message, true);
  }
}

async function deleteTask(taskId) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this task?"
  );

  if (!confirmed) {
    return;
  }

  try {
    setMessage("Deleting task...");

    const response = await fetch(
      `${API_BASE_URL}/api/tasks/${taskId}`,
      {
        method: "DELETE"
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not delete task.");
    }

    await loadTasks();

    setMessage("Task deleted successfully.");
  } catch (error) {
    console.error(error);
    setMessage(error.message, true);
  }
}

function editTask(taskId) {
  const task = tasks.find(function (task) {
    return task.id === taskId;
  });

  if (!task) {
    return;
  }

  document.getElementById("title").value = task.title;
  document.getElementById("description").value =
    task.description || "";
  document.getElementById("assigned_employee").value =
    task.assigned_employee || "";
  document.getElementById("status").value = task.status;
  document.getElementById("priority").value = task.priority;
  document.getElementById("due_date").value =
    task.due_date || "";

  editingTaskId = task.id;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  setMessage(`Editing task #${task.id}`);
}

function renderTasks() {
  taskList.innerHTML = "";

  const selectedStatus = statusFilter.value;

  const filteredTasks = tasks.filter(function (task) {
    if (selectedStatus === "All") {
      return true;
    }

    return task.status === selectedStatus;
  });

  if (filteredTasks.length === 0) {
    if (tasks.length === 0) {
      setMessage("No tasks yet.");
    } else {
      setMessage("No tasks match this filter.");
    }

    return;
  }

  setMessage(
    `${filteredTasks.length} task(s) shown — ${tasks.length} total`
  );

  filteredTasks.forEach(function (task) {
    const taskCard = document.createElement("div");

    taskCard.classList.add("task-card");

    if (task.status === "Completed") {
      taskCard.classList.add("completed-task");
    }

    taskCard.innerHTML = `
      <h3>${escapeHtml(task.title)}</h3>

      <p>${escapeHtml(
        task.description || "No description provided."
      )}</p>

      <div class="task-meta">
        <span class="badge">
          ${escapeHtml(task.status)}
        </span>

        <span class="badge">
          ${escapeHtml(task.priority)} Priority
        </span>
      </div>

      <div class="task-details">
        <p>
          <strong>Assigned to:</strong>
          ${escapeHtml(
            task.assigned_employee || "Unassigned"
          )}
        </p>

        <p>
          <strong>Due date:</strong>
          ${escapeHtml(task.due_date || "No due date")}
        </p>
      </div>

      <div class="task-actions">
        <button
          class="edit-button"
          data-id="${task.id}"
        >
          Edit
        </button>

        <button
          class="complete-button"
          data-id="${task.id}"
          ${task.status === "Completed" ? "disabled" : ""}
        >
          Complete
        </button>

        <button
          class="delete-button"
          data-id="${task.id}"
        >
          Delete
        </button>
      </div>
    `;

    taskList.appendChild(taskCard);
  });

  addButtonEvents();
}

function addButtonEvents() {
  document
    .querySelectorAll(".edit-button")
    .forEach(function (button) {
      button.addEventListener("click", function () {
        editTask(Number(button.dataset.id));
      });
    });

  document
    .querySelectorAll(".complete-button")
    .forEach(function (button) {
      button.addEventListener("click", function () {
        completeTask(Number(button.dataset.id));
      });
    });

  document
    .querySelectorAll(".delete-button")
    .forEach(function (button) {
      button.addEventListener("click", function () {
        deleteTask(Number(button.dataset.id));
      });
    });
}

function setMessage(text, isError = false) {
  message.textContent = text;

  if (isError) {
    message.style.background = "#fee2e2";
  } else {
    message.style.background = "#eef2ff";
  }
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}