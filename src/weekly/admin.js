/*
  Requirement: Make the "Manage Weekly Breakdown" page interactive.
*/

// --- API URL ---
const WEEKS_URL = "./api/index.php?resource=weeks";

// --- Global Data ---
let weeks = [];

// --- Element Selections ---
const weekForm = document.getElementById("week-form");
const weeksTableBody = document.getElementById("weeks-tbody");

const titleInput = document.getElementById("week-title");
const dateInput = document.getElementById("week-start-date");
const descInput = document.getElementById("week-description");
const linksInput = document.getElementById("week-links");

const submitBtn = document.getElementById("add-week");
const formTitle = document.getElementById("form-title");
const cancelBtn = document.getElementById("cancel-edit-button");

// Hide cancel button initially
cancelBtn.style.display = "none";


// --- Functions ---


/**
 * Create a table row for a week
 */
function createWeekRow(week) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${week.title}</td>
    <td>${week.description}</td>
    <td class="action-td">
        <button class="edit-btn" data-id="${week.id}">Edit</button>
        <button class="delete-btn" data-id="${week.id}">Delete</button>
    </td>
  `;

  return tr;
}


/**
 * Render the table
 */
function renderTable() {
  weeksTableBody.innerHTML = "";
  weeks.forEach(week => {
    weeksTableBody.appendChild(createWeekRow(week));
  });
}


/**
 * Handle Add or Update
 */
function handleAddWeek(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const start_date = dateInput.value;
  const description = descInput.value.trim();
  let links = linksInput.value.split("\n").map(l => l.trim()).filter(l => l !== "");

  const editId = weekForm.dataset.editId;

  // -----------------
  // ADD WEEK
  // -----------------
  if (!editId) {
    const newWeek = {
      id: "",
      title,
      start_date,
      description,
      links
    };

    fetch(WEEKS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newWeek)
    })
      .then(res => res.json())
      .then(result => {
        if (!result.success) throw new Error("API Error");

        newWeek.id = result.data;
        weeks.push(newWeek);

        renderTable();
        weekForm.reset();
      })
      .catch(err => console.error(err));

  } else {
    // -----------------
    // UPDATE WEEK
    // -----------------
    const updated = {
      id: editId,
      title,
      start_date,
      description,
      links
    };

    fetch(WEEKS_URL + "&id=" + editId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    })
      .then(res => res.json())
      .then(result => {
        if (!result.success) throw new Error(result.error);

        const week = weeks.find(w => w.id == editId);
        Object.assign(week, updated);

        renderTable();
        resetEditMode();
      })
      .catch(err => console.error(err));
  }
}


/**
 * Reset form from Edit → Add mode
 */
function resetEditMode() {
  delete weekForm.dataset.editId;
  weekForm.reset();
  submitBtn.textContent = "Add Week";
  cancelBtn.style.display = "none";
  formTitle.textContent = "Add a New Week";
}


/**
 * Table event handler (Edit/Delete)
 */
function handleTableClick(event) {
  const btn = event.target;

  // -----------------
  // DELETE
  // -----------------
  if (btn.classList.contains("delete-btn")) {
    const id = btn.dataset.id;

    fetch(WEEKS_URL + "&id=" + id, { method: "DELETE" })
      .then(res => res.json())
      .then(result => {
        if (!result.success) throw new Error(result.error);

        weeks = weeks.filter(w => w.id != id);
        renderTable();
      })
      .catch(err => console.error(err));
  }

  // -----------------
  // EDIT
  // -----------------
  if (btn.classList.contains("edit-btn")) {
    const id = btn.dataset.id;
    const week = weeks.find(w => w.id == id);

    titleInput.value = week.title;
    dateInput.value = week.start_date;
    descInput.value = week.description;
    linksInput.value = week.links.join("\n");

    weekForm.dataset.editId = id;
    submitBtn.textContent = "Update Week";
    cancelBtn.style.display = "inline-block";
    formTitle.textContent = "Update Week";

    weekForm.scrollIntoView({ behavior: "smooth" });
  }
}


// Cancel edit button
cancelBtn.addEventListener("click", resetEditMode);


/**
 * Load table initially
 */
async function loadAndInitialize() {
  try {
    const res = await fetch(WEEKS_URL);
    const result = await res.json();

    if (!result.success) throw new Error(result.error);

    weeks = result.data;
    renderTable();

    weekForm.addEventListener("submit", handleAddWeek);
    weeksTableBody.addEventListener("click", handleTableClick);

  } catch (err) {
    console.error("Failed to load weeks:", err);
  }
}


// Start
loadAndInitialize();
