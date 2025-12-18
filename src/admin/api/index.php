<?php
/**
 * Student Management API
 * 
 * This is a RESTful API that handles all CRUD operations for student management.
 * It uses PDO to interact with a MySQL database.
 * 
 * Database Table Structure (for reference):
 * Table: students
 * Columns:
 *   - id (INT, PRIMARY KEY, AUTO_INCREMENT)
 *   - student_id (VARCHAR(50), UNIQUE) - The student's university ID
 *   - name (VARCHAR(100))
 *   - email (VARCHAR(100), UNIQUE)
 *   - password (VARCHAR(255)) - Hashed password
 *   - created_at (TIMESTAMP)
 * 
 * HTTP Methods Supported:
 *   - GET: Retrieve student(s)
 *   - POST: Create a new student OR change password
 *   - PUT: Update an existing student
 *   - DELETE: Delete a student
 * 
 * Response Format: JSON
 */

// TODO: Set headers for JSON response and CORS
header("Content-Type: application/json;");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// TODO: Handle preflight OPTIONS request
// If the request method is OPTIONS, return 200 status and exit
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


// TODO: Include the database connection class
// Assume the Database class has a method getConnection() that returns a PDO instance
require_once '../../config/Database.php';



// TODO: Get the PDO database connection
$db = (new Database())->getConnection();

// TODO: Get the HTTP request method
// Use $_SERVER['REQUEST_METHOD']
$method = $_SERVER['REQUEST_METHOD'];

// TODO: Get the request body for POST and PUT requests
// Use file_get_contents('php://input') to get raw POST data
// Decode JSON data using json_decode()
$input = json_decode(file_get_contents('php://input'), true);

// TODO: Parse query parameters for filtering and searching
$search    = $_GET['search']     ?? null;
$sort      = $_GET['sort']       ?? null;
$order     = $_GET['order']      ?? null;
$studentId = $_GET['student_id'] ?? null;


/**
 * Function: Get all students or search for specific students
 * Method: GET
 * 
 * Query Parameters:
 *   - search: Optional search term to filter by name, student_id, or email
 *   - sort: Optional field to sort by (name, student_id, email)
 *   - order: Optional sort order (asc or desc)
 */
function getStudents($db) {
    $search = $_GET['search'] ?? null;
    $sort   = $_GET['sort']   ?? null;
    $order  = $_GET['order']  ?? null;

    $allowedSortFields = ['name', 'student_id', 'email'];
    $allowedOrder      = ['asc', 'desc'];

    $sql = "SELECT id, student_id, name, email, created_at FROM students";

    if ($search) {
        $sql .= " WHERE name LIKE :search OR student_id LIKE :search OR email LIKE :search";
    }

    if ($sort && in_array($sort, $allowedSortFields, true)) {
        $order = in_array(strtolower($order), $allowedOrder, true) ? strtoupper($order) : 'ASC';
        $sql .= " ORDER BY $sort $order";
    }

    $stmt = $db->prepare($sql);

    if ($search) {
        $stmt->bindValue(':search', "%$search%");
    }

    $stmt->execute();

    echo json_encode([
        'success' => true,
        'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);
}
/**
 * Function: Get a single student by student_id
 * Method: GET
 * 
 * Query Parameters:
 *   - student_id: The student's university ID
 */
function getStudentById($db, $studentId) {
$sql = "SELECT id, student_id, name, email, created_at FROM students WHERE student_id = :student_id";
$stmt = $db->prepare($sql);
$stmt->bindValue(':student_id', $studentId);
$stmt->execute();

$student = $stmt->fetch(PDO::FETCH_ASSOC);

if ($student) {
    http_response_code(200);
    echo json_encode(['success' => true, 'data' => $student]);
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Student not found']);
}
}

/**
 * Function: Create a new student
 * Method: POST
 * 
 * Required JSON Body:
 *   - student_id: The student's university ID (must be unique)
 *   - name: Student's full name
 *   - email: Student's email (must be unique)
 *   - password: Default password (will be hashed)
 */
function createStudent($db, $data) {
$student_id = $data['student_id'] ?? null;
$name       = $data['name']       ?? null;
$email      = $data['email']      ?? null;
$password   = $data['password']   ?? null;

if (!$student_id || !$name || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    return;
}

$student_id = trim($student_id);
$name       = trim($name);
$email      = trim($email);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    return;
}

$checkSql = "SELECT id FROM students WHERE student_id = :student_id OR email = :email";
$checkStmt = $db->prepare($checkSql);
$checkStmt->bindValue(':student_id', $student_id);
$checkStmt->bindValue(':email', $email);
$checkStmt->execute();

if ($checkStmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Student ID or email already exists']);
    return;
}

$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$sql = "INSERT INTO students (student_id, name, email, password)
        VALUES (:student_id, :name, :email, :password)";
$stmt = $db->prepare($sql);
$stmt->bindValue(':student_id', $student_id);
$stmt->bindValue(':name', $name);
$stmt->bindValue(':email', $email);
$stmt->bindValue(':password', $hashedPassword);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode(['success' => true, 'message' => 'Student created successfully']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Student was not created']);
}
}
/**
 * Function: Update an existing student
 * Method: PUT
 * 
 * Required JSON Body:
 *   - student_id: The student's university ID (to identify which student to update)
 *   - name: Updated student name (optional)
 *   - email: Updated student email (optional)
 */
function updateStudent($db, $data) {
$student_id = $data['student_id'] ?? null;
$name  = $data['name']  ?? null;
$email = $data['email'] ?? null;

if (!$student_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'student_id is required']);
    return;
}

$checkSql = "SELECT id FROM students WHERE student_id = :student_id";
$checkStmt = $db->prepare($checkSql);
$checkStmt->bindValue(':student_id', $student_id);
$checkStmt->execute();

if (!$checkStmt->fetch()) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Student not found']);
    return;
}

$fields = [];
$params = [];

if ($name !== null) {
    $fields[] = 'name = :name';
    $params[':name'] = trim($name);
}

if ($email !== null) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        return;
    }

    $emailCheck = $db->prepare(
        "SELECT id FROM students WHERE email = :email AND student_id != :student_id"
    );
    $emailCheck->bindValue(':email', $email);
    $emailCheck->bindValue(':student_id', $student_id);
    $emailCheck->execute();

    if ($emailCheck->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Email already exists']);
        return;
    }

    $fields[] = 'email = :email';
    $params[':email'] = trim($email);
}

if (!$fields) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No fields to update']);
    return;
}

$sql = "UPDATE students SET " . implode(', ', $fields) . " WHERE student_id = :student_id";
$stmt = $db->prepare($sql);

foreach ($params as $k => $v) {
    $stmt->bindValue($k, $v);
}
$stmt->bindValue(':student_id', $student_id);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Student updated successfully']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update student']);
}
}


/**
 * Function: Delete a student
 * Method: DELETE
 * 
 * Query Parameters or JSON Body:
 *   - student_id: The student's university ID
 */
function deleteStudent($db, $studentId) {
if (!$studentId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'student_id is required']);
    return;
}

$check = $db->prepare("SELECT id FROM students WHERE student_id = :student_id");
$check->bindValue(':student_id', $studentId);
$check->execute();

if (!$check->fetch()) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Student not found']);
    return;
}

$stmt = $db->prepare("DELETE FROM students WHERE student_id = :student_id");
$stmt->bindValue(':student_id', $studentId);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Student deleted successfully']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to delete student']);
}
}


/**
 * Function: Change password
 * Method: POST with action=change_password
 * 
 * Required JSON Body:
 *   - student_id: The student's university ID (identifies whose password to change)
 *   - current_password: The student's current password
 *   - new_password: The new password to set
 */
function changePassword($db, $data) {
$student_id = $data['student_id'] ?? null;
$current_password = $data['current_password'] ?? null;
$new_password = $data['new_password'] ?? null;

if (!$student_id || !$current_password || !$new_password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    return;
}

if (strlen($new_password) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'New password must be at least 8 characters long']);
    return;
}

$stmt = $db->prepare("SELECT password FROM students WHERE student_id = :student_id");
$stmt->bindValue(':student_id', $student_id);
$stmt->execute();
$student = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$student || !password_verify($current_password, $student['password'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    return;
}

$hashed = password_hash($new_password, PASSWORD_DEFAULT);
$update = $db->prepare("UPDATE students SET password = :password WHERE student_id = :student_id");
$update->bindValue(':password', $hashed);
$update->bindValue(':student_id', $student_id);

if ($update->execute()) {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Password updated successfully']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update password']);
}
}


// ============================================================================
// MAIN REQUEST ROUTER
// ============================================================================

try {
    if ($method === 'GET') {
        $studentId ? getStudentById($db, $studentId) : getStudents($db);
    } elseif ($method === 'POST') {
        if (($_GET['action'] ?? null) === 'change_password') {
            changePassword($db, $input);
        } else {
            createStudent($db, $input);
        }
    } elseif ($method === 'PUT') {
        updateStudent($db, $input);
    } elseif ($method === 'DELETE') {
        $sid = $_GET['student_id'] ?? $input['student_id'] ?? null;
        deleteStudent($db, $sid);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}



// ============================================================================
// HELPER FUNCTIONS (Optional but Recommended)
// ============================================================================

/**
 * Helper function to send JSON response
 * 
 * @param mixed $data - Data to send
 * @param int $statusCode - HTTP status code
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}


/**
 * Helper function to validate email format
 * 
 * @param string $email - Email address to validate
 * @return bool - True if valid, false otherwise
 */
function validateEmail($email) {
return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}


/**
 * Helper function to sanitize input
 * 
 * @param string $data - Data to sanitize
 * @return string - Sanitized data
 */
function sanitizeInput($data) {
$data = trim($data);
$data = strip_tags($data);
$data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
return $data;
}

?>
