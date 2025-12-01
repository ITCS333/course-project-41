/*
  Requirement: Make the "Manage Assignments" page interactive.
*/

// --- Global Data Store ---
// This will hold the assignments loaded from the JSON file.
let assignments = [];
let editingAssignmentId = null; // null = add mode

// --- Element Selections ---
const assignmentForm = document.querySelector("#assignment-form");
const assignmentsTableBody = document.querySelector("#assignments-tbody");

// --- Functions ---

/**
 * Create one <tr> for an assignment.
 * assignment = { id, title, dueDate }
 */
function createAssignmentRow(assignment) {
  const { id, title, dueDate } = assignment;

  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${title}</td>
    <td>${dueDate || "-"}</td>
    <td>
      <button class="edit-btn" data-id="${id}">Edit</button>
      <button class="delete-btn" data-id="${id}">Delete</button>
    </td>
  `;

  return row;
}

/**
 * Render all assignments into the table body.
 */
function renderTable() {
  if (!assignmentsTableBody) return;

  assignmentsTableBody.innerHTML = "";

  assignments.forEach((assignment) => {
    const row = createAssignmentRow(assignment);
    assignmentsTableBody.appendChild(row);
  });
}

/**
 * Handle form submit: add OR update assignment.
 */
function handleAddAssignment(event) {
  event.preventDefault();

  const titleInput = document.getElementById("title");
  const dueDateInput = document.getElementById("due-date");

  if (!titleInput || titleInput.value.trim() === "") {
    alert("Assignment title cannot be empty.");
    return;
  }

  const title = titleInput.value.trim();
  const dueDate = dueDateInput ? dueDateInput.value : "";

  if (editingAssignmentId === null) {
    // --- ADD NEW ASSIGNMENT ---
    const newAssignment = {
      id: `asg_${Date.now()}`,
      title: title,
      dueDate: dueDate,
    };

    assignments.push(newAssignment);
  } else {
    // --- UPDATE EXISTING ASSIGNMENT ---
    const existing = assignments.find(
      (assignment) => assignment.id === editingAssignmentId
    );

    if (existing) {
      existing.title = title;
      existing.dueDate = dueDate;
    }

    editingAssignmentId = null;

    const submitButton = assignmentForm
      ? assignmentForm.querySelector("button[type='submit']")
      : null;
    if (submitButton) {
      submitButton.textContent = "Save Assignment";
    }
  }

  renderTable();

  // Clear form
  titleInput.value = "";
  if (dueDateInput) {
    dueDateInput.value = "";
  }
}

/**
 * Handle clicks on the table (Edit / Delete).
 */
function handleTableClick(event) {
  const target = event.target;

  // --- DELETE BUTTON ---
  if (target.classList.contains("delete-btn")) {
    const idToDelete = target.dataset.id;

    assignments = assignments.filter(
      (assignment) => assignment.id !== idToDelete
    );

    renderTable();
    return;
  }

  // --- EDIT BUTTON ---
  if (target.classList.contains("edit-btn")) {
    const idToEdit = target.dataset.id;
    const assignmentToEdit = assignments.find(
      (assignment) => assignment.id === idToEdit
    );

    if (!assignmentToEdit) return;

    const titleInput = document.getElementById("title");
    const dueDateInput = document.getElementById("due-date");

    if (titleInput) titleInput.value = assignmentToEdit.title || "";
    if (dueDateInput) dueDateInput.value = assignmentToEdit.dueDate || "";

    editingAssignmentId = idToEdit;

    const submitButton = assignmentForm
      ? assignmentForm.querySelector("button[type='submit']")
      : null;
    if (submitButton) {
      submitButton.textContent = "Update Assignment";
    }
  }
}

/**
 * Load initial data from assignments.json and connect events.
 */
async function loadAndInitialize() {
  try {
    const response = await fetch("api/assignments.json");
    if (response.ok) {
      const data = await response.json();
      assignments = data.map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
      }));
      renderTable();
    } else {
      console.error("Failed to load assignments.json:", response.status);
    }
  } catch (error) {
    console.error("Error loading assignments.json:", error);
  }

  if (assignmentForm) {
    assignmentForm.addEventListener("submit", handleAddAssignment);
  }

  if (assignmentsTableBody) {
    assignmentsTableBody.addEventListener("click", handleTableClick);
  }
}

// --- Initial Page Load ---
loadAndInitialize();
