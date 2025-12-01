const WEEKS_URL = "./api/index.php?resource=weeks";

let weeks = [];

const weekForm = document.getElementById("week-form");
const weeksTableBody = document.getElementById("weeks-tbody");

const titleInput = document.getElementById("week-title");
const dateInput = document.getElementById("week-start-date");
const descInput = document.getElementById("week-description");
const linksInput = document.getElementById("week-links");

const submitBtn = document.getElementById("add-week");
const formTitle = document.getElementById("form-title");
const cancelBtn = document.getElementById("cancel-edit-button");

cancelBtn.style.display = "none";

function createWeekRow(week) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${week.title}</td>
    <td>${week.description}</td>
    <td class="action-td">
        <button class="edit-btn" data-id="${week.week_id}">Edit</button>
        <button class="delete-btn" data-id="${week.week_id}">Delete</button>
    </td>
  `;

  return tr;
}

function renderTable() {
  weeksTableBody.innerHTML = "";
  weeks.forEach(week => {
    weeksTableBody.appendChild(createWeekRow(week));
  });
}

function handleAddWeek(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const start_date = dateInput.value;
  const description = descInput.value.trim();
  let links = linksInput.value.split("\n").map(l => l.trim()).filter(l => l !== "");

  const editId = weekForm.dataset.editId;

  if (!editId) {
    const newWeek = {
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
        if (!result.success) throw new Error(result.error || "API Error");

        newWeek.week_id = result.week_id;
        weeks.push(newWeek);

        renderTable();
        weekForm.reset();
      })
      .catch(err => console.error(err));

  } else {
    const updated = {
      week_id: editId,
      title,
      start_date,
      description,
      links
    };

    fetch(WEEKS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    })
      .then(res => res.json())
      .then(result => {
        if (!result.success) throw new Error(result.error);

        const week = weeks.find(w => w.week_id == editId);
        Object.assign(week, updated);

        renderTable();
        resetEditMode();
      })
      .catch(err => console.error(err));
  }
}

function resetEditMode() {
  delete weekForm.dataset.editId;
  weekForm.reset();
  submitBtn.textContent = "Add Week";
  cancelBtn.style.display = "none";
  formTitle.textContent = "Add a New Week";
}

function handleTableClick(event) {
  const btn = event.target;

  if (btn.classList.contains("delete-btn")) {
    const weekId = btn.dataset.id;

    fetch(WEEKS_URL + "&week_id=" + weekId, { method: "DELETE" })
      .then(res => res.json())
      .then(result => {
        if (!result.success) throw new Error(result.error);

        weeks = weeks.filter(w => w.week_id != weekId);
        renderTable();
      })
      .catch(err => console.error(err));
  }

  if (btn.classList.contains("edit-btn")) {
    const weekId = btn.dataset.id;
    const week = weeks.find(w => w.week_id == weekId);

    titleInput.value = week.title;
    dateInput.value = week.start_date;
    descInput.value = week.description;
    linksInput.value = (week.links || []).join("\n");

    weekForm.dataset.editId = weekId;
    submitBtn.textContent = "Update Week";
    cancelBtn.style.display = "inline-block";
    formTitle.textContent = "Update Week";

    weekForm.scrollIntoView({ behavior: "smooth" });
  }
}

cancelBtn.addEventListener("click", resetEditMode);

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

loadAndInitialize();
