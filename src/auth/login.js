/*
  Requirement: Add client-side validation to the login form.

  Instructions:
  1. Link this file to your HTML using a <script> tag with the 'defer' attribute.
     Example: <script src="login.js" defer></script>
  
  2. In your login.html, add a <div> element *after* the </fieldset> but
     *before* the </form> closing tag. Give it an id="message-container".
     This div will be used to display success or error messages.
     Example: <div id="message-container"></div>
  
  3. Implement the JavaScript functionality as described in the TODO comments.
*/

/*
  Requirement: Add client-side validation to the login form.
*/

// --- Element Selections ---

// Select the login form
let loginForm = document.getElementById("login-form");

// Select the email input
let emailInput = document.getElementById("email");

// Select the password input
let passwordInput = document.getElementById("password");

// Select the message container
let messageContainer = document.getElementById("message-container");

// --- Functions ---

/**
 * Display success or error messages
 */
function displayMessage(message, type) {
  messageContainer.textContent = message;
  messageContainer.className = type;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  let regex = /\S+@\S+\.\S+/;
  return regex.test(email);
}

/**
 * Validate password length
 */
function isValidPassword(password) {
  return password.length >= 8;
}

/**
 * Handle login form submission
 */
function handleLogin(event) {
  event.preventDefault();

  let email = emailInput.value.trim();
  let password = passwordInput.value.trim();

  if (!isValidEmail(email)) {
    displayMessage("Invalid email format.", "error");
    return;
  }

  if (!isValidPassword(password)) {
    displayMessage("Password must be at least 8 characters.", "error");
    return;
  }

  displayMessage("Login successful!", "success");

  emailInput.value = "";
  passwordInput.value = "";
}

/**
 * Set up login form event listener
 */
function setupLoginForm() {
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
}

// --- Initial Page Load ---
setupLoginForm();
