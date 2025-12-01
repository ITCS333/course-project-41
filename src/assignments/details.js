/*
  Requirement: Populate the assignment detail page and discussion forum.

  This file is linked from details.html as:
  <script src="details.js" defer></script>
*/

// --- Global Data Store ---
// These will hold the data related to *this* assignment.
let currentAssignmentId = null;
let currentComments = [];

// --- Element Selections ---
const assignmentTitle = document.getElementById("assignment-title");
const assignmentDueDate = document.getElementById("assignment-due-date");
const assignmentDescription = document.getElementById("assignment-description");
const assignmentFilesList = document.getElementById("assignment-files-list");
const commentList = document.getElementById("comment-list");
const commentForm = document.getElementById("comment-form");
const newCommentText = document.getElementById("new-comment-text");

// --- Functions ---

/**
 * Get the assignment id from the URL (e.g., ?id=asg_1).
 */
function getAssignmentIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id"); // "asg_1", "asg_2", etc.
}

/**
 * Render the assignment details on the page.
 */
function renderAssignmentDetails(assignment) {
  if (!assignment) return;

  if (assignmentTitle) {
    assignmentTitle.textContent = assignment.title;
  }

  if (assignmentDueDate) {
    assignmentDueDate.textContent = `Due: ${assignment.dueDate || "TBA"}`;
  }

  if (assignmentDescription) {
    assignmentDescription.textContent = assignment.description || "";
  }

  if (assignmentFilesList) {
    // Clear any existing list items
    assignmentFilesList.innerHTML = "";

    if (Array.isArray(assignment.files)) {
      assignment.files.forEach((fileName) => {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = "#"; // No real link needed for now
        link.textContent = fileName;
        li.appendChild(link);
        assignmentFilesList.appendChild(li);
      });
    }
  }
}

/**
 * Create a single <article> element for a comment.
 * comment = { author, text }
 */
function createCommentArticle(comment) {
  const article = document.createElement("article");

  const p = document.createElement("p");
  p.textContent = comment.text || "";

  const footer = document.createElement("footer");
  footer.innerHTML = `<em>Posted by: ${comment.author || "Student"}</em>`;

  article.appendChild(p);
  article.appendChild(footer);

  return article;
}

/**
 * Render all comments in currentComments into #comment-list.
 */
function renderComments() {
  if (!commentList) return;

  // Clear existing comments
  commentList.innerHTML = "";

  currentComments.forEach((comment) => {
    const article = createCommentArticle(comment);
    commentList.appendChild(article);
  });
}

/**
 * Handle the comment form submit event.
 */
function handleAddComment(event) {
  event.preventDefault();

  if (!newCommentText) return;

  const commentText = newCommentText.value.trim();
  if (commentText === "") {
    return;
  }

  const newComment = {
    author: "Student", // Hardcoded as requested
    text: commentText,
  };

  // Add to the in-memory comments array
  currentComments.push(newComment);

  // Re-render
  renderComments();

  // Clear textarea
  newCommentText.value = "";
}

/**
 * Initialize the page:
 * - Read ID from URL
 * - Fetch assignments + comments JSON
 * - Find the right assignment + its comments
 * - Render details + comments
 * - Wire up form submit
 */
async function initializePage() {
  currentAssignmentId = getAssignmentIdFromURL();

  if (!currentAssignmentId) {
    if (assignmentTitle) {
      assignmentTitle.textContent = "Assignment not found.";
    }
    return;
  }

  try {
    // Adjust paths if needed based on your folder structure.
    // Here we assume: assignments/api/assignments.json and comments.json
    const [assignmentsResponse, commentsResponse] = await Promise.all([
      fetch("api/assignments.json"),
      fetch("api/comments.json"),
    ]);

    const assignments = await assignmentsResponse.json(); // array
    const commentsData = await commentsResponse.json();   // object: { "asg_1": [ ... ], ... }

    // Find the correct assignment
    const assignment = assignments.find(
      (item) => item.id === currentAssignmentId
    );

    // Get comments for this assignment id (could be undefined)
    currentComments = commentsData[currentAssignmentId] || [];

    if (!assignment) {
      if (assignmentTitle) {
        assignmentTitle.textContent = "Assignment not found.";
      }
      return;
    }

    // Render the assignment + comments
    renderAssignmentDetails(assignment);
    renderComments();

    // Wire up the comment form
    if (commentForm) {
      commentForm.addEventListener("submit", handleAddComment);
    }
  } catch (error) {
    console.error("Error loading assignment details:", error);
    if (assignmentTitle) {
      assignmentTitle.textContent = "Error loading assignment details.";
    }
  }
}

// --- Initial Page Load ---
initializePage();
