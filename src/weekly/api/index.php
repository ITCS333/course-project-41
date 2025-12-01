<?php
/**
 * Weekly Course Breakdown API
 * Complete implementation with all TODOs filled.
 * Supports CRUD for weeks and comments using auto-generated week_id.
 */

// ============================================================================
// SETUP AND CONFIGURATION
// ============================================================================

// JSON output + CORS
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle OPTIONS preflight
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

// Include Database connection
require_once "../../config/Database.php";

$database = new Database();
$db = $database->getConnection();

$method  = $_SERVER['REQUEST_METHOD'];
$rawBody = file_get_contents("php://input");
$data    = json_decode($rawBody, true);
$resource = $_GET['resource'] ?? 'weeks';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function sendError($message, $statusCode = 400) {
    sendResponse(["success" => false, "error" => $message], $statusCode);
}

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function validateDate($date) {
    $d = DateTime::createFromFormat("Y-m-d", $date);
    return $d && $d->format("Y-m-d") === $date;
}

function isValidSortField($field, $allowed) {
    return in_array($field, $allowed);
}

function generateNextWeekId($db) {
    $stmt = $db->prepare("SELECT week_id FROM weeks ORDER BY id DESC LIMIT 1");
    $stmt->execute();
    $last = $stmt->fetch();

    if (!$last || !preg_match('/week_(\d+)/', $last["week_id"], $m)) {
        return "week_1";
    }

    $next = intval($m[1]) + 1;
    return "week_" . $next;
}


// ============================================================================
// WEEKS CRUD
// ============================================================================

function getAllWeeks($db) {
    $search = $_GET["search"] ?? null;
    $sort   = $_GET["sort"] ?? "start_date";
    $order  = strtolower($_GET["order"] ?? "asc");

    $allowedSort = ["title", "start_date", "created_at"];
    if (!isValidSortField($sort, $allowedSort)) $sort = "start_date";
    if (!in_array($order, ["asc", "desc"])) $order = "asc";

    $sql = "SELECT * FROM weeks";
    $params = [];

    if ($search) {
        $sql .= " WHERE title LIKE ? OR description LIKE ?";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    $sql .= " ORDER BY $sort $order";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        $row["links"] = $row["links"] ? json_decode($row["links"], true) : [];
    }

    sendResponse(["success" => true, "data" => $rows]);
}

function getWeekById($db, $weekId) {
    if (empty($weekId)) sendError("week_id parameter is missing", 400);

    $stmt = $db->prepare("SELECT * FROM weeks WHERE week_id = ?");
    $stmt->execute([$weekId]);
    $week = $stmt->fetch();

    if (!$week) sendError("Week not found", 404);

    $week["links"] = json_decode($week["links"], true);

    sendResponse(["success" => true, "data" => $week]);
}

function createWeek($db, $data) {
    if (empty($data["title"]) || empty($data["start_date"]) || empty($data["description"])) {
        sendError("Missing required fields", 400);
    }

    if (!validateDate($data["start_date"])) {
        sendError("Invalid date format YYYY-MM-DD", 400);
    }

    $title = sanitizeInput($data["title"]);
    $desc  = sanitizeInput($data["description"]);
    $start = $data["start_date"];

    $weekId = generateNextWeekId($db);

    $links = json_encode($data["links"] ?? []);

    $stmt = $db->prepare("INSERT INTO weeks (week_id, title, start_date, description, links) VALUES (?, ?, ?, ?, ?)");
    $ok = $stmt->execute([$weekId, $title, $start, $desc, $links]);

    if ($ok) {
        sendResponse(["success" => true, "week_id" => $weekId], 201);
    }

    sendError("Failed to create week", 500);
}

function updateWeek($db, $data) {
    if (empty($data["week_id"])) sendError("week_id is required");

    $week_id = $data["week_id"];

    // Check existence
    $stmt = $db->prepare("SELECT * FROM weeks WHERE week_id = ?");
    $stmt->execute([$week_id]);
    if (!$stmt->fetch()) sendError("Week not found", 404);

    $fields = [];
    $values = [];

    if (isset($data["title"])) {
        $fields[] = "title = ?";
        $values[] = sanitizeInput($data["title"]);
    }

    if (isset($data["start_date"])) {
        if (!validateDate($data["start_date"])) sendError("Invalid date format");
        $fields[] = "start_date = ?";
        $values[] = $data["start_date"];
    }

    if (isset($data["description"])) {
        $fields[] = "description = ?";
        $values[] = sanitizeInput($data["description"]);
    }

    if (isset($data["links"])) {
        $fields[] = "links = ?";
        $values[] = json_encode($data["links"]);
    }

    if (empty($fields)) sendError("No fields to update", 400);

    $fields[] = "updated_at = CURRENT_TIMESTAMP";

    $sql = "UPDATE weeks SET " . implode(", ", $fields) . " WHERE week_id = ?";
    $values[] = $week_id;

    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    sendResponse(["success" => true, "message" => "Week updated"]);
}

function deleteWeek($db, $weekId) {
    if (empty($weekId)) sendError("week_id required");

    $stmt = $db->prepare("SELECT * FROM weeks WHERE week_id = ?");
    $stmt->execute([$weekId]);
    if (!$stmt->fetch()) sendError("Week not found", 404);

    $stmt = $db->prepare("DELETE FROM comments WHERE week_id = ?");
    $stmt->execute([$weekId]);

    $stmt = $db->prepare("DELETE FROM weeks WHERE week_id = ?");
    $ok = $stmt->execute([$weekId]);

    if ($ok) sendResponse(["success" => true, "message" => "Week and its comments deleted"]);
    sendError("Failed to delete week", 500);
}


// ============================================================================
// COMMENTS CRUD
// ============================================================================

function getCommentsByWeek($db, $weekId) {
    if (empty($weekId)) sendError("week_id required");

    $stmt = $db->prepare("SELECT * FROM comments WHERE week_id = ? ORDER BY created_at ASC");
    $stmt->execute([$weekId]);
    $rows = $stmt->fetchAll();

    sendResponse(["success" => true, "data" => $rows]);
}

function createComment($db, $data) {
    if (empty($data["week_id"]) || empty($data["author"]) || empty($data["text"])) {
        sendError("Missing required fields");
    }

    $weekId = sanitizeInput($data["week_id"]);
    $author = sanitizeInput($data["author"]);
    $text   = sanitizeInput($data["text"]);

    $stmt = $db->prepare("SELECT * FROM weeks WHERE week_id = ?");
    $stmt->execute([$weekId]);
    if (!$stmt->fetch()) sendError("Week not found", 404);

    $stmt = $db->prepare("INSERT INTO comments (week_id, author, text) VALUES (?, ?, ?)");
    $ok = $stmt->execute([$weekId, $author, $text]);

    if ($ok) sendResponse(["success" => true, "comment_id" => $db->lastInsertId()], 201);

    sendError("Failed to create comment", 500);
}

function deleteComment($db, $commentId) {
    if (empty($commentId)) sendError("Missing id");

    $stmt = $db->prepare("SELECT * FROM comments WHERE id = ?");
    $stmt->execute([$commentId]);
    if (!$stmt->fetch()) sendError("Comment not found", 404);

    $stmt = $db->prepare("DELETE FROM comments WHERE id = ?");
    $ok = $stmt->execute([$commentId]);

    if ($ok) sendResponse(["success" => true, "message" => "Comment deleted"]);

    sendError("Failed to delete comment", 500);
}


// ============================================================================
// MAIN ROUTER
// ============================================================================

try {

    if ($resource === "weeks") {

        if ($method === "GET") {
            if (!empty($_GET["week_id"])) getWeekById($db, $_GET["week_id"]);
            getAllWeeks($db);

        } elseif ($method === "POST") {
            createWeek($db, $data);

        } elseif ($method === "PUT") {
            updateWeek($db, $data);

        } elseif ($method === "DELETE") {
            deleteWeek($db, $_GET["week_id"] ?? $data["week_id"] ?? null);

        } else {
            sendError("Method Not Allowed", 405);
        }

    } elseif ($resource === "comments") {

        if ($method === "GET") {
            getCommentsByWeek($db, $_GET["week_id"]);

        } elseif ($method === "POST") {
            createComment($db, $data);

        } elseif ($method === "DELETE") {
            deleteComment($db, $_GET["id"] ?? $data["id"] ?? null);

        } else {
            sendError("Method Not Allowed", 405);
        }

    } else {
        sendError("Invalid resource. Use 'weeks' or 'comments'.", 400);
    }

} catch (Exception $e) {
    error_log($e->getMessage());
    sendError("Server error", 500);
}

?>
