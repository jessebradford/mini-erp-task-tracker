const API_BASE_URL =
  "https://mini-erp-task-tracker-api.jessebradford10.workers.dev";

/* ==================================================
   ELEMENTS
================================================== */

const form =
  document.getElementById("task-form");

const saveTaskButton =
  document.getElementById("save-task-button");

const taskList =
  document.getElementById("task-list");

const taskTableBody =
  document.getElementById("task-table-body");

const message =
  document.getElementById("message");

const cardView =
  document.getElementById("card-view");

const tableView =
  document.getElementById("table-view");

const viewToggle =
  document.getElementById("view-toggle");

const statusFilter =
  document.getElementById("status-filter");

const priorityFilter =
  document.getElementById("priority-filter");

const personFilter =
  document.getElementById("person-filter");

const searchInput =
  document.getElementById("task-search");

const sortSelect =
  document.getElementById("sort-select");

const hideCompleted =
  document.getElementById("hide-completed");

const compactView =
  document.getElementById("compact-view");

const themeToggle =
  document.getElementById("theme-toggle");

const cancelEditButton =
  document.getElementById("cancel-edit");

const resetFiltersButton =
  document.getElementById("reset-filters");

const summaryTotal =
  document.getElementById("summary-total");

const summaryOpen =
  document.getElementById("summary-open");

const summaryProgress =
  document.getElementById("summary-progress");

const summaryBlocked =
  document.getElementById("summary-blocked");

const summaryCompleted =
  document.getElementById("summary-completed");

const summaryOverdue =
  document.getElementById("summary-overdue");

/* ==================================================
   STATE
================================================== */

let tasks = [];

let editingTaskId = null;

let currentView = "cards";

let tableSortColumn = "id";

let tableSortDirection = "asc";

/* ==================================================
   PREFERENCES
================================================== */

const STORAGE_KEYS = {
  theme: "miniErpTheme",
  view: "miniErpView",
  compact: "miniErpCompact"
};

/* ==================================================
   INITIALIZATION
================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async function () {
    restorePreferences();

    await loadTasks();
  }
);

/* ==================================================
   FORM CREATE / EDIT
================================================== */

form.addEventListener(
  "submit",
  async function (event) {
    event.preventDefault();

    const formData =
      new FormData(form);

    const taskData = {
      title:
        formData.get("title"),

      description:
        formData.get("description"),

      assigned_employee:
        formData.get(
          "assigned_employee"
        ),

      status:
        formData.get("status"),

      priority:
        formData.get("priority"),

      due_date:
        formData.get("due_date")
    };

    try {
      setMessage("Saving task...");

      saveTaskButton.disabled = true;

      if (editingTaskId !== null) {
        await updateTask(
          editingTaskId,
          taskData
        );

        editingTaskId = null;
      } else {
        await createTask(taskData);
      }

      form.reset();

      updateFormMode();

      await loadTasks();

      setMessage(
        "Task saved successfully."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.message,
        true
      );
    } finally {
      saveTaskButton.disabled = false;
    }
  }
);

/* ==================================================
   FILTER EVENTS
================================================== */

statusFilter.addEventListener(
  "change",
  renderCurrentView
);

priorityFilter.addEventListener(
  "change",
  renderCurrentView
);

personFilter.addEventListener(
  "change",
  renderCurrentView
);

searchInput.addEventListener(
  "input",
  renderCurrentView
);

sortSelect.addEventListener(
  "change",
  renderCurrentView
);

hideCompleted.addEventListener(
  "change",
  renderCurrentView
);

/* ==================================================
   RESET FILTERS
================================================== */

resetFiltersButton.addEventListener(
  "click",
  function () {
    searchInput.value = "";

    personFilter.value = "All";

    statusFilter.value = "All";

    priorityFilter.value = "All";

    sortSelect.value = "newest";

    hideCompleted.checked = false;

    tableSortColumn = "id";

    tableSortDirection = "asc";

    renderCurrentView();

    setMessage("Filters reset.");
  }
);

/* ==================================================
   VIEW TOGGLE
================================================== */

viewToggle.addEventListener(
  "change",
  function () {
    currentView =
      viewToggle.checked
        ? "table"
        : "cards";

    localStorage.setItem(
      STORAGE_KEYS.view,
      currentView
    );

    applyView();

    renderCurrentView();
  }
);

function applyView() {
  if (currentView === "table") {
    viewToggle.checked = true;

    cardView.classList.add(
      "hidden"
    );

    tableView.classList.remove(
      "hidden"
    );
  } else {
    viewToggle.checked = false;

    tableView.classList.add(
      "hidden"
    );

    cardView.classList.remove(
      "hidden"
    );
  }
}

/* ==================================================
   COMPACT MODE
================================================== */

compactView.addEventListener(
  "change",
  function () {
    document.body.classList.toggle(
      "compact",
      compactView.checked
    );

    localStorage.setItem(
      STORAGE_KEYS.compact,
      compactView.checked
        ? "true"
        : "false"
    );
  }
);

/* ==================================================
   THEME
================================================== */

themeToggle.addEventListener(
  "click",
  function () {
    document.body.classList.toggle(
      "dark"
    );

    const darkMode =
      document.body.classList.contains(
        "dark"
      );

    localStorage.setItem(
      STORAGE_KEYS.theme,
      darkMode
        ? "dark"
        : "light"
    );

    updateThemeButton();
  }
);

function updateThemeButton() {
  const darkMode =
    document.body.classList.contains(
      "dark"
    );

  themeToggle.textContent =
    darkMode
      ? "Light Mode"
      : "Dark Mode";
}

/* ==================================================
   RESTORE PREFERENCES
================================================== */

function restorePreferences() {
  const savedTheme =
    localStorage.getItem(
      STORAGE_KEYS.theme
    );

  const savedView =
    localStorage.getItem(
      STORAGE_KEYS.view
    );

  const savedCompact =
    localStorage.getItem(
      STORAGE_KEYS.compact
    );

  if (savedTheme === "dark") {
    document.body.classList.add(
      "dark"
    );
  }

  updateThemeButton();

  if (savedView === "table") {
    currentView = "table";
  }

  applyView();

  if (savedCompact === "true") {
    compactView.checked = true;

    document.body.classList.add(
      "compact"
    );
  }
}

/* ==================================================
   CLEAR FORM
================================================== */

cancelEditButton.addEventListener(
  "click",
  function () {
    editingTaskId = null;

    form.reset();

    updateFormMode();

    setMessage("Form cleared.");
  }
);

function updateFormMode() {
  if (editingTaskId !== null) {
    saveTaskButton.textContent =
      "Update Task";

    cancelEditButton.textContent =
      "Cancel Edit";
  } else {
    saveTaskButton.textContent =
      "Save Task";

    cancelEditButton.textContent =
      "Clear Form";
  }
}

/* ==================================================
   LOAD TASKS
================================================== */

async function loadTasks() {
  try {
    setMessage("Loading tasks...");

    const response =
      await fetch(
        `${API_BASE_URL}/api/tasks`
      );

    if (!response.ok) {
      throw new Error(
        "Could not load tasks."
      );
    }

    tasks =
      await response.json();

    updateEmployeeDropdown();

    updateSummary();

    renderCurrentView();
  } catch (error) {
    console.error(error);

    setMessage(
      error.message,
      true
    );
  }
}

/* ==================================================
   EMPLOYEE LIST
================================================== */

function getEmployees() {
  return [
    ...new Set(
      tasks
        .map(function (task) {
          return (
            task.assigned_employee ||
            ""
          ).trim();
        })
        .filter(Boolean)
    )
  ].sort(function (a, b) {
    return a.localeCompare(
      b,
      undefined,
      {
        sensitivity: "base"
      }
    );
  });
}

/* ==================================================
   EMPLOYEE FILTER DROPDOWN
================================================== */

function updateEmployeeDropdown() {
  const previousValue =
    personFilter.value;

  const employees =
    getEmployees();

  personFilter.innerHTML = `
    <option value="All">
      All Employees
    </option>

    <option value="__unassigned__">
      Unassigned
    </option>
  `;

  employees.forEach(
    function (employee) {
      const option =
        document.createElement(
          "option"
        );

      option.value = employee;

      option.textContent =
        employee;

      personFilter.appendChild(
        option
      );
    }
  );

  const validValues = [
    "All",
    "__unassigned__",
    ...employees
  ];

  personFilter.value =
    validValues.includes(
      previousValue
    )
      ? previousValue
      : "All";
}

/* ==================================================
   SUMMARY
================================================== */

function updateSummary() {
  const open =
    tasks.filter(function (task) {
      return task.status === "Open";
    }).length;

  const progress =
    tasks.filter(function (task) {
      return (
        task.status ===
        "In Progress"
      );
    }).length;

  const blocked =
    tasks.filter(function (task) {
      return (
        task.status === "Blocked"
      );
    }).length;

  const completed =
    tasks.filter(function (task) {
      return (
        task.status ===
        "Completed"
      );
    }).length;

  const overdue =
    tasks.filter(isTaskOverdue)
      .length;

  summaryTotal.textContent =
    tasks.length;

  summaryOpen.textContent =
    open;

  summaryProgress.textContent =
    progress;

  summaryBlocked.textContent =
    blocked;

  summaryCompleted.textContent =
    completed;

  summaryOverdue.textContent =
    overdue;
}

/* ==================================================
   OVERDUE LOGIC
================================================== */

function isTaskOverdue(task) {
  if (
    !task.due_date ||
    task.status === "Completed"
  ) {
    return false;
  }

  const dueDate =
    new Date(
      `${task.due_date}T23:59:59`
    );

  return (
    dueDate.getTime() <
    Date.now()
  );
}

/* ==================================================
   FILTER TASKS
================================================== */

function getFilteredTasks() {
  const selectedStatus =
    statusFilter.value;

  const selectedPriority =
    priorityFilter.value;

  const selectedPerson =
    personFilter.value;

  const searchTerm =
    searchInput.value
      .trim()
      .toLowerCase();

  return tasks.filter(
    function (task) {
      const matchesStatus =
        selectedStatus === "All" ||
        task.status ===
          selectedStatus;

      const matchesPriority =
        selectedPriority === "All" ||
        task.priority ===
          selectedPriority;

      let matchesPerson = true;

      if (
        selectedPerson ===
        "__unassigned__"
      ) {
        matchesPerson =
          !task.assigned_employee ||
          !task.assigned_employee.trim();
      } else if (
        selectedPerson !== "All"
      ) {
        matchesPerson =
          task.assigned_employee ===
          selectedPerson;
      }

      const searchableTaskText = [
        task.title,
        task.description
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesTaskSearch =
        searchTerm === "" ||
        searchableTaskText.includes(
          searchTerm
        );

      const matchesCompleted =
        !hideCompleted.checked ||
        task.status !==
          "Completed";

      return (
        matchesStatus &&
        matchesPriority &&
        matchesPerson &&
        matchesTaskSearch &&
        matchesCompleted
      );
    }
  );
}

/* ==================================================
   RENDER
================================================== */

function renderCurrentView() {
  if (currentView === "table") {
    renderTable();
  } else {
    renderCards();
  }
}

/* ==================================================
   CARD VIEW
================================================== */

function renderCards() {
  taskList.innerHTML = "";

  let filteredTasks =
    getFilteredTasks();

  filteredTasks =
    sortCards(filteredTasks);

  updateResultMessage(
    filteredTasks.length
  );

  filteredTasks.forEach(
    function (task) {
      const taskCard =
        document.createElement(
          "div"
        );

      taskCard.classList.add(
        "task-card"
      );

      if (
        task.status === "Completed"
      ) {
        taskCard.classList.add(
          "completed-task"
        );
      }

      if (isTaskOverdue(task)) {
        taskCard.classList.add(
          "overdue-task"
        );
      }

      const overdueBadge =
        isTaskOverdue(task)
          ? `
            <span
              class="badge overdue-badge"
            >
              Overdue
            </span>
          `
          : "";

      const completeButton =
        task.status === "Completed"
          ? `
            <button
              class="complete-button"
              disabled
            >
              Completed
            </button>
          `
          : `
            <button
              class="complete-button"
              data-id="${task.id}"
            >
              Mark Complete
            </button>
          `;

      taskCard.innerHTML = `
        <h3>
          ${escapeHtml(task.title)}
        </h3>

        <p>
          ${escapeHtml(
            task.description ||
            "No description provided."
          )}
        </p>

        <div class="task-meta">
          <span class="badge">
            ${escapeHtml(
              task.status
            )}
          </span>

          <span class="badge">
            ${escapeHtml(
              task.priority
            )}
            Priority
          </span>

          ${overdueBadge}
        </div>

        <div class="task-details">
          <p>
            <strong>
              Assigned to:
            </strong>

            ${escapeHtml(
              task.assigned_employee ||
              "Unassigned"
            )}
          </p>

          <p>
            <strong>
              Due date:
            </strong>

            ${escapeHtml(
              task.due_date ||
              "No due date"
            )}
          </p>
        </div>

        <div class="task-actions">
          <button
            class="edit-button"
            data-id="${task.id}"
          >
            Edit
          </button>

          ${completeButton}

          <button
            class="delete-button"
            data-id="${task.id}"
          >
            Delete
          </button>
        </div>
      `;

      taskList.appendChild(
        taskCard
      );
    }
  );

  addCardButtonEvents();
}

/* ==================================================
   CARD SORT
================================================== */

function sortCards(taskArray) {
  const result =
    [...taskArray];

  result.sort(
    function (a, b) {
      const sortValue =
        sortSelect.value;

      if (
        sortValue === "title"
      ) {
        return a.title.localeCompare(
          b.title
        );
      }

      if (
        sortValue === "due-date"
      ) {
        return compareNullableDates(
          a.due_date,
          b.due_date
        );
      }

      if (
        sortValue === "priority"
      ) {
        const priorityOrder = {
          High: 1,
          Medium: 2,
          Low: 3
        };

        return (
          priorityOrder[
            a.priority
          ] -
          priorityOrder[
            b.priority
          ]
        );
      }

      return (
        new Date(
          b.created_at
        ) -
        new Date(
          a.created_at
        )
      );
    }
  );

  return result;
}

/* ==================================================
   TABLE VIEW
================================================== */

function renderTable() {
  taskTableBody.innerHTML =
    "";

  let filteredTasks =
    getFilteredTasks();

  filteredTasks =
    sortTableTasks(
      filteredTasks
    );

  updateResultMessage(
    filteredTasks.length
  );

  filteredTasks.forEach(
    function (task) {
      const row =
        document.createElement(
          "tr"
        );

      if (
        task.status ===
        "Completed"
      ) {
        row.classList.add(
          "completed-row"
        );
      }

      if (isTaskOverdue(task)) {
        row.classList.add(
          "overdue-row"
        );
      }

      row.innerHTML = `
        <td>
          <span
            class="table-readonly"
          >
            ${task.id}
          </span>
        </td>

        <td class="title-cell">
          <input
            type="text"
            class="table-editable"
            data-id="${task.id}"
            data-field="title"
            value="${escapeAttribute(
              task.title
            )}"
          />
        </td>

        <td class="description-cell">
          <input
            type="text"
            class="table-editable"
            data-id="${task.id}"
            data-field="description"
            value="${escapeAttribute(
              task.description || ""
            )}"
          />
        </td>

        <td class="employee-cell">
          <select
            class="table-editable employee-editor"
            data-id="${task.id}"
            data-field="assigned_employee"
          >
            ${employeeOptions(
              task.assigned_employee
            )}
          </select>
        </td>

        <td>
          <select
            class="table-editable"
            data-id="${task.id}"
            data-field="status"
          >
            ${statusOptions(
              task.status
            )}
          </select>
        </td>

        <td>
          <select
            class="table-editable"
            data-id="${task.id}"
            data-field="priority"
          >
            ${priorityOptions(
              task.priority
            )}
          </select>
        </td>

        <td>
          <input
            type="date"
            class="table-editable"
            data-id="${task.id}"
            data-field="due_date"
            value="${escapeAttribute(
              task.due_date || ""
            )}"
          />
        </td>

        <td>
          <span
            class="table-readonly"
          >
            ${formatDateTime(
              task.created_at
            )}
          </span>
        </td>

        <td>
          <span
            class="table-readonly"
          >
            ${formatDateTime(
              task.updated_at
            )}
          </span>
        </td>

        <td>
          <div
            class="table-actions"
          >
            <button
              class="table-edit-button"
              data-id="${task.id}"
            >
              Form Edit
            </button>

            <button
              class="table-delete-button"
              data-id="${task.id}"
            >
              Delete
            </button>
          </div>
        </td>
      `;

      taskTableBody.appendChild(
        row
      );
    }
  );

  addTableEditEvents();

  addTableActionEvents();

  updateSortIndicators();
}

/* ==================================================
   EMPLOYEE TABLE OPTIONS
================================================== */

function employeeOptions(
  currentEmployee
) {
  const employees =
    getEmployees();

  const normalizedCurrent =
    currentEmployee || "";

  let html = `
    <option
      value=""
      ${
        normalizedCurrent === ""
          ? "selected"
          : ""
      }
    >
      Unassigned
    </option>
  `;

  employees.forEach(
    function (employee) {
      html += `
        <option
          value="${escapeAttribute(
            employee
          )}"
          ${
            employee ===
            normalizedCurrent
              ? "selected"
              : ""
          }
        >
          ${escapeHtml(
            employee
          )}
        </option>
      `;
    }
  );

  html += `
    <option value="__new__">
      + Add new employee...
    </option>
  `;

  return html;
}

/* ==================================================
   TABLE EDITING
================================================== */

function addTableEditEvents() {
  document
    .querySelectorAll(
      ".table-editable"
    )
    .forEach(
      function (input) {
        input.addEventListener(
          "focus",
          function () {
            input.dataset.originalValue =
              input.value;
          }
        );

        input.addEventListener(
          "change",
          async function () {
            const taskId =
              Number(
                input.dataset.id
              );

            const field =
              input.dataset.field;

            const originalValue =
              input.dataset
                .originalValue ?? "";

            let newValue =
              input.value;

            if (
              field ===
                "assigned_employee" &&
              newValue === "__new__"
            ) {
              const enteredName =
                window.prompt(
                  "Enter the new employee name:"
                );

              if (
                enteredName === null ||
                !enteredName.trim()
              ) {
                input.value =
                  originalValue;

                return;
              }

              newValue =
                enteredName.trim();
            }

            if (
              newValue ===
              originalValue
            ) {
              return;
            }

            const confirmed =
              window.confirm(
                "Are you sure you would like to make this change?"
              );

            if (!confirmed) {
              input.value =
                originalValue;

              return;
            }

            await updateTableCell(
              taskId,
              field,
              newValue
            );
          }
        );
      }
    );
}

/* ==================================================
   UPDATE ONE TABLE CELL
================================================== */

async function updateTableCell(
  taskId,
  field,
  newValue
) {
  const existingTask =
    tasks.find(
      function (task) {
        return (
          task.id ===
          taskId
        );
      }
    );

  if (!existingTask) {
    return;
  }

  const updatedTaskData = {
    title:
      existingTask.title,

    description:
      existingTask.description ||
      "",

    assigned_employee:
      existingTask.assigned_employee ||
      "",

    status:
      existingTask.status,

    priority:
      existingTask.priority,

    due_date:
      existingTask.due_date ||
      ""
  };

  updatedTaskData[field] =
    newValue;

  if (
    field === "title" &&
    !newValue.trim()
  ) {
    window.alert(
      "Task title cannot be empty."
    );

    renderTable();

    return;
  }

  try {
    setMessage(
      "Updating task..."
    );

    await updateTask(
      taskId,
      updatedTaskData
    );

    await loadTasks();

    setMessage(
      "Task updated successfully."
    );
  } catch (error) {
    console.error(error);

    setMessage(
      error.message,
      true
    );

    await loadTasks();
  }
}

/* ==================================================
   TABLE SORT HEADERS
================================================== */

document
  .querySelectorAll(
    ".task-table th[data-sort]"
  )
  .forEach(
    function (header) {
      header.addEventListener(
        "click",
        function () {
          const column =
            header.dataset.sort;

          if (
            tableSortColumn ===
            column
          ) {
            tableSortDirection =
              tableSortDirection ===
              "asc"
                ? "desc"
                : "asc";
          } else {
            tableSortColumn =
              column;

            tableSortDirection =
              "asc";
          }

          renderTable();
        }
      );
    }
  );

/* ==================================================
   SORT TABLE
================================================== */

function sortTableTasks(
  taskArray
) {
  const result =
    [...taskArray];

  result.sort(
    function (a, b) {
      let comparison = 0;

      const column =
        tableSortColumn;

      if (column === "id") {
        comparison =
          a.id - b.id;
      }

      else if (
        column === "due_date"
      ) {
        comparison =
          compareNullableDates(
            a.due_date,
            b.due_date
          );
      }

      else if (
        column ===
          "created_at" ||
        column ===
          "updated_at"
      ) {
        comparison =
          new Date(
            a[column]
          ) -
          new Date(
            b[column]
          );
      }

      else if (
        column === "priority"
      ) {
        const priorityOrder = {
          Low: 1,
          Medium: 2,
          High: 3
        };

        comparison =
          priorityOrder[
            a.priority
          ] -
          priorityOrder[
            b.priority
          ];
      }

      else {
        const aValue =
          (
            a[column] || ""
          ).toString();

        const bValue =
          (
            b[column] || ""
          ).toString();

        comparison =
          aValue.localeCompare(
            bValue,
            undefined,
            {
              sensitivity:
                "base"
            }
          );
      }

      return (
        tableSortDirection ===
        "asc"
          ? comparison
          : -comparison
      );
    }
  );

  return result;
}

/* ==================================================
   SORT ARROWS
================================================== */

function updateSortIndicators() {
  document
    .querySelectorAll(
      ".task-table th[data-sort]"
    )
    .forEach(
      function (header) {
        const indicator =
          header.querySelector(
            ".sort-indicator"
          );

        if (
          header.dataset.sort ===
          tableSortColumn
        ) {
          indicator.textContent =
            tableSortDirection ===
            "asc"
              ? "▲"
              : "▼";
        } else {
          indicator.textContent =
            "";
        }
      }
    );
}

/* ==================================================
   API CREATE
================================================== */

async function createTask(
  taskData
) {
  const response =
    await fetch(
      `${API_BASE_URL}/api/tasks`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(
            taskData
          )
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Could not create task."
    );
  }

  return data;
}

/* ==================================================
   API UPDATE
================================================== */

async function updateTask(
  taskId,
  taskData
) {
  const response =
    await fetch(
      `${API_BASE_URL}/api/tasks/${taskId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(
            taskData
          )
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Could not update task."
    );
  }

  return data;
}

/* ==================================================
   COMPLETE TASK
================================================== */

async function completeTask(
  taskId
) {
  const task =
    tasks.find(
      function (task) {
        return (
          task.id ===
          taskId
        );
      }
    );

  if (!task) {
    return;
  }

  const confirmed =
    window.confirm(
      `Mark "${task.title}" as completed?`
    );

  if (!confirmed) {
    return;
  }

  try {
    setMessage(
      "Updating task..."
    );

    const response =
      await fetch(
        `${API_BASE_URL}/api/tasks/${taskId}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              status:
                "Completed"
            })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Could not complete task."
      );
    }

    await loadTasks();

    setMessage(
      "Task marked as completed."
    );
  } catch (error) {
    console.error(error);

    setMessage(
      error.message,
      true
    );
  }
}

/* ==================================================
   DELETE
================================================== */

async function deleteTask(
  taskId
) {
  const task =
    tasks.find(
      function (task) {
        return (
          task.id ===
          taskId
        );
      }
    );

  if (!task) {
    return;
  }

  const confirmed =
    window.confirm(
      `Delete "${task.title}"? This cannot be undone.`
    );

  if (!confirmed) {
    return;
  }

  try {
    setMessage(
      "Deleting task..."
    );

    const response =
      await fetch(
        `${API_BASE_URL}/api/tasks/${taskId}`,
        {
          method:
            "DELETE"
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Could not delete task."
      );
    }

    if (
      editingTaskId === taskId
    ) {
      editingTaskId = null;

      form.reset();

      updateFormMode();
    }

    await loadTasks();

    setMessage(
      "Task deleted successfully."
    );
  } catch (error) {
    console.error(error);

    setMessage(
      error.message,
      true
    );
  }
}

/* ==================================================
   FORM EDIT
================================================== */

function editTask(taskId) {
  const task =
    tasks.find(
      function (task) {
        return (
          task.id ===
          taskId
        );
      }
    );

  if (!task) {
    return;
  }

  document
    .getElementById(
      "title"
    )
    .value =
      task.title;

  document
    .getElementById(
      "description"
    )
    .value =
      task.description || "";

  document
    .getElementById(
      "assigned_employee"
    )
    .value =
      task.assigned_employee ||
      "";

  document
    .getElementById(
      "status"
    )
    .value =
      task.status;

  document
    .getElementById(
      "priority"
    )
    .value =
      task.priority;

  document
    .getElementById(
      "due_date"
    )
    .value =
      task.due_date || "";

  editingTaskId =
    task.id;

  updateFormMode();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  setMessage(
    `Editing "${task.title}"`
  );
}

/* ==================================================
   CARD BUTTON EVENTS
================================================== */

function addCardButtonEvents() {
  document
    .querySelectorAll(
      ".edit-button"
    )
    .forEach(
      function (button) {
        button.addEventListener(
          "click",
          function () {
            editTask(
              Number(
                button.dataset.id
              )
            );
          }
        );
      }
    );

  document
    .querySelectorAll(
      ".complete-button[data-id]"
    )
    .forEach(
      function (button) {
        button.addEventListener(
          "click",
          function () {
            completeTask(
              Number(
                button.dataset.id
              )
            );
          }
        );
      }
    );

  document
    .querySelectorAll(
      ".delete-button"
    )
    .forEach(
      function (button) {
        button.addEventListener(
          "click",
          function () {
            deleteTask(
              Number(
                button.dataset.id
              )
            );
          }
        );
      }
    );
}

/* ==================================================
   TABLE BUTTON EVENTS
================================================== */

function addTableActionEvents() {
  document
    .querySelectorAll(
      ".table-edit-button"
    )
    .forEach(
      function (button) {
        button.addEventListener(
          "click",
          function () {
            editTask(
              Number(
                button.dataset.id
              )
            );
          }
        );
      }
    );

  document
    .querySelectorAll(
      ".table-delete-button"
    )
    .forEach(
      function (button) {
        button.addEventListener(
          "click",
          function () {
            deleteTask(
              Number(
                button.dataset.id
              )
            );
          }
        );
      }
    );
}

/* ==================================================
   RESULT MESSAGE
================================================== */

function updateResultMessage(
  count
) {
  if (count === 0) {
    if (tasks.length === 0) {
      setMessage(
        "No tasks yet."
      );
    } else {
      setMessage(
        "No tasks match the current filters."
      );
    }

    return;
  }

  setMessage(
    `${count} task(s) shown — ${tasks.length} total`
  );
}

function setMessage(
  text,
  isError = false
) {
  message.textContent =
    text;

  if (isError) {
    message.style.background =
      "#fee2e2";

    message.style.color =
      "#991b1b";
  } else {
    message.style.background =
      "";

    message.style.color =
      "";
  }
}

/* ==================================================
   HELPERS
================================================== */

function compareNullableDates(
  a,
  b
) {
  if (!a && !b) {
    return 0;
  }

  if (!a) {
    return 1;
  }

  if (!b) {
    return -1;
  }

  return a.localeCompare(b);
}

function statusOptions(
  currentStatus
) {
  const statuses = [
    "Open",
    "In Progress",
    "Blocked",
    "Completed"
  ];

  return statuses
    .map(
      function (status) {
        return `
          <option
            value="${status}"
            ${
              status ===
              currentStatus
                ? "selected"
                : ""
            }
          >
            ${status}
          </option>
        `;
      }
    )
    .join("");
}

function priorityOptions(
  currentPriority
) {
  const priorities = [
    "Low",
    "Medium",
    "High"
  ];

  return priorities
    .map(
      function (priority) {
        return `
          <option
            value="${priority}"
            ${
              priority ===
              currentPriority
                ? "selected"
                : ""
            }
          >
            ${priority}
          </option>
        `;
      }
    )
    .join("");
}

function formatDateTime(
  value
) {
  if (!value) {
    return "";
  }

  const normalizedValue =
    value.includes("T")
      ? value
      : value.replace(
          " ",
          "T"
        ) + "Z";

  const date =
    new Date(
      normalizedValue
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}

function escapeHtml(
  value
) {
  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    value ?? "";

  return div.innerHTML;
}

function escapeAttribute(
  value
) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    );
}