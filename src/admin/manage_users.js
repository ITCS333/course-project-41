/*
  Requirement: Add interactivity and data management to the Admin Portal.

  Instructions:
  1. Link this file to your HTML using a <script> tag with the 'defer' attribute.
     Example: <script src="manage_users.js" defer></script>
  2. Implement the JavaScript functionality as described in the TODO comments.
  3. All data management will be done by manipulating the 'students' array
     and re-rendering the table.
*/

// --- Global Data Store ---
// This array will be populated with data fetched from 'students.json'.
let students = [];

// --- Element Selections ---
// We can safely select elements here because 'defer' guarantees
// the HTML document is parsed before this script runs.

// TODO: Select the student table body (tbody).
  let studentTableBody = document.getElementById("student-table").getElementsByTagName("tbody")[0];
// TODO: Select the "Add Student" form.
// (You'll need to add id="add-student-form" to this form in your HTML).
let addStuForm=document.getElementById("add-student-form");

// TODO: Select the "Change Password" form.
// (You'll need to add id="password-form" to this form in your HTML).
let changePassForm=document.getElementById("password-form");

// TODO: Select the search input field.
// (You'll need to add id="search-input" to this input in your HTML).
let searchInput=document.getElementById("search-input");

// TODO: Select all table header (th) elements in thead.
let tableHeaders = document.querySelectorAll("thead th");

// --- Functions ---

/**
 * TODO: Implement the createStudentRow function.
 * This function should take a student object {name, id, email} and return a <tr> element.
 * The <tr> should contain:
 * 1. A <td> for the student's name.
 * 2. A <td> for the student's ID.
 * 3. A <td> for the student's email.
 * 4. A <td> containing two buttons:
 * - An "Edit" button with class "edit-btn" and a data-id attribute set to the student's ID.
 * - A "Delete" button with class "delete-btn" and a data-id attribute set to the student's ID.
 */
function createStudentRow(student) {
  // ... your implementation here ...
  let row = document.createElement("tr");
  let name = document.createElement("td");
  let ID = document.createElement("td");
  let email = document.createElement("td");
  let buttons = document.createElement("td");

  name.textContent = student.name;
  ID.textContent = student.id;
  email.textContent = student.email;
  row.appendChild(name);
  row.appendChild(ID);
  row.appendChild(email);

  let editButton = document.createElement("button");
  editButton.textContent = "Edit";
  editButton.classList.add("edit-btn");
  editButton.dataset.id = student.id;
  buttons.appendChild(editButton);

  let deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.classList.add("delete-btn");
  deleteButton.dataset.id=student.id;
  buttons.appendChild(deleteButton);

  row.appendChild(buttons);
  return row;
}

/**
 * TODO: Implement the renderTable function.
 * This function takes an array of student objects.
 * It should:
 * 1. Clear the current content of the `studentTableBody`.
 * 2. Loop through the provided array of students.
 * 3. For each student, call `createStudentRow` and append the returned <tr> to `studentTableBody`.
 */
function renderTable(studentArray) {
  // ... your implementation here ...
  studentTableBody.innerHTML ="";
  for (let i=0; i<studentArray.length; i++){
studentTableBody.appendChild(createStudentRow(studentArray[i]));
  }
}

/**
 * TODO: Implement the handleChangePassword function.
 * This function will be called when the "Update Password" button is clicked.
 * It should:
 * 1. Prevent the form's default submission behavior.
 * 2. Get the values from "current-password", "new-password", and "confirm-password" inputs.
 * 3. Perform validation:
 * - If "new-password" and "confirm-password" do not match, show an alert: "Passwords do not match."
 * - If "new-password" is less than 8 characters, show an alert: "Password must be at least 8 characters."
 * 4. If validation passes, show an alert: "Password updated successfully!"
 * 5. Clear all three password input fields.
 */
function handleChangePassword(event) {
  // ... your implementation here ...
  event.preventDefault();
  let currentPassword = document.getElementById("current-password");
  let newPassword = document.getElementById("new-password");
  let confirmPassword = document.getElementById("confirm-password");
  if (!(newPassword.value == confirmPassword.value)){
    alert("Passwords do not match.");}
  else if (newPassword.value.length < 8){
    alert("Password must be at least 8 characters.");}
  else{
    alert("Password updated successfully!");}
  
currentPassword.value ="";
newPassword.value ="";
confirmPassword.value ="";
}

/**
 * TODO: Implement the handleAddStudent function.
 * This function will be called when the "Add Student" button is clicked.
 * It should:
 * 1. Prevent the form's default submission behavior.
 * 2. Get the values from "student-name", "student-id", and "student-email".
 * 3. Perform validation:
 * - If any of the three fields are empty, show an alert: "Please fill out all required fields."
 * - (Optional) Check if a student with the same ID already exists in the 'students' array.
 * 4. If validation passes:
 * - Create a new student object: { name, id, email }.
 * - Add the new student object to the global 'students' array.
 * - Call `renderTable(students)` to update the view.
 * 5. Clear the "student-name", "student-id", "student-email", and "default-password" input fields.
 */
function handleAddStudent(event) {
  // ... your implementation here ...
  event.preventDefault();
  let name = document.getElementById("student-name");
  let ID = document.getElementById("student-id");
  let email = document.getElementById("student-email");

  if ((name.value == "")||(ID.value == "")||(email.value == "")){alert("Please fill out all required fields.");}
  else if(students.some(student => student.id === ID.value)){
    alert("Student with the same ID already exists.");
  }
  else{
    let newStudent = {name: name.value, id: ID.value, email:email.value};
    students.push(newStudent);
    renderTable(students);
    name.value ="";
    ID.value =""; 
    email.value ="";
    document.getElementById("default-password").value ="";
  }
}

/**
 * TODO: Implement the handleTableClick function.
 * This function will be an event listener on the `studentTableBody` (event delegation).
 * It should:
 * 1. Check if the clicked element (`event.target`) has the class "delete-btn".
 * 2. If it is a "delete-btn":
 * - Get the `data-id` attribute from the button.
 * - Update the global 'students' array by filtering out the student with the matching ID.
 * - Call `renderTable(students)` to update the view.
 * 3. (Optional) Check for "edit-btn" and implement edit logic.
 */
function handleTableClick(event) {
  // ... your implementation here ...
  if (event.target.classList.contains("delete-btn")){
    let id =event.target.dataset.id;
    students = students.filter(student => student.id !== id);
    renderTable(students);
  }
  else if (event.target.classList.contains("edit-btn")) {
    let id = event.target.dataset.id;
    alert("Edit student with ID: " + id);
  }
  else{
    return;
  }
}

/**
 * TODO: Implement the handleSearch function.
 * This function will be called on the "input" event of the `searchInput`.
 * It should:
 * 1. Get the search term from `searchInput.value` and convert it to lowercase.
 * 2. If the search term is empty, call `renderTable(students)` to show all students.
 * 3. If the search term is not empty:
 * - Filter the global 'students' array to find students whose name (lowercase)
 * includes the search term.
 * - Call `renderTable` with the *filtered array*.
 */
function handleSearch(event) {
  // ... your implementation here ...
  let searchInput = document.getElementById("search-input").value.toLowerCase();
  if(searchInput == ""){
    renderTable(students);
  }
  else{
    let filteredStudents = students.filter(student => student.name.toLowerCase().includes(searchInput));
    renderTable(filteredStudents);
  }
}

/**
 * TODO: Implement the handleSort function.
 * This function will be called when any `th` in the `thead` is clicked.
 * It should:
 * 1. Identify which column was clicked (e.g., `event.currentTarget.cellIndex`).
 * 2. Determine the property to sort by ('name', 'id', 'email') based on the index.
 * 3. Determine the sort direction. Use a data-attribute (e.g., `data-sort-dir="asc"`) on the `th`
 * to track the current direction. Toggle between "asc" and "desc".
 * 4. Sort the global 'students' array *in place* using `array.sort()`.
 * - For 'name' and 'email', use `localeCompare` for string comparison.
 * - For 'id', compare the values as numbers.
 * 5. Respect the sort direction (ascending or descending).
 * 6. After sorting, call `renderTable(students)` to update the view.
 */
function handleSort(event) {
  // ... your implementation here ...
  let columnIndex = event.currentTarget.cellIndex;
  let property = ["name", "id", "email"][columnIndex];
  let direction = event.currentTarget.dataset.sortDir || "asc";
  event.currentTarget.dataset.sortDir = direction === "asc" ? "desc" : "asc";
  students.sort((a, b) =>
    property === "id"
                ? direction === "asc"
                  ? Number(a[property]) - Number(b[property])
                  : Number(b[property]) - Number(a[property])
                : direction === "asc"
                ? a[property].localeCompare(b[property])
                : b[property].localeCompare(a[property])
                );
  renderTable(students);
}

/**
 * TODO: Implement the loadStudentsAndInitialize function.
 * This function needs to be 'async'.
 * It should:
 * 1. Use the `fetch()` API to get data from 'students.json'.
 * 2. Check if the response is 'ok'. If not, log an error.
 * 3. Parse the JSON response (e.g., `await response.json()`).
 * 4. Assign the resulting array to the global 'students' variable.
 * 5. Call `renderTable(students)` to populate the table for the first time.
 * 6. After data is loaded, set up all the event listeners:
 * - "submit" on `changePasswordForm` -> `handleChangePassword`
 * - "submit" on `addStudentForm` -> `handleAddStudent`
 * - "click" on `studentTableBody` -> `handleTableClick`
 * - "input" on `searchInput` -> `handleSearch`
 * - "click" on each header in `tableHeaders` -> `handleSort`
 */
async function loadStudentsAndInitialize() {
  // ... your implementation here ...
  try{
    let response = await fetch("../students.json");
    if (response.ok){
      let data = await response.json();
      students = data;
      renderTable(students);
changePassForm.addEventListener("submit" ,handleChangePassword);
addStuForm.addEventListener("submit", handleAddStudent);
studentTableBody.addEventListener("click" ,handleTableClick);
searchInput.addEventListener("input" ,handleSearch);
for (let i = 0; i < tableHeaders.length; i++){
  tableHeaders[i].addEventListener("click", handleSort);
}               
    }
    else{
      throw new Error("Network response was not ok");
    }
  }
  catch (error) {
    console.error("Failed to load students:", error);
  }
}
// --- Initial Page Load ---
// Call the main async function to start the application.
loadStudentsAndInitialize();
