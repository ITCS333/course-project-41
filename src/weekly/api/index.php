<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

require_once "../../config/Database.php";

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    sendError("Database connection failed", 500);
}

$method  = $_SERVER['REQUEST_METHOD'];
$rawBody = file_get_contents("php://input");
$data    = json_decode($rawBody, true);
$resource = $_GET['resource'] ?? 'weeks';

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
        $row["week_id"] = "week_" . $row["id"];
        $row["links"] = $row["links"] ? json_decode($row["links"], true) : [];
    }

    sendResponse(["success" => true, "data" => $rows]);
}

function getWeekById($db, $weekId) {
    if (empty($weekId)) sendError("week_id parameter is missing", 400);

    $numericId = str_replace("week_", "", $weekId);

    $stmt = $db->prepare("SELECT * FROM weeks WHERE id = ?");
    $stmt->execute([$numericId]);
    $week = $stmt->fetch();

    if (!$week) sendError("Week not found", 404);

    $week["week_id"] = "week_" . $week["id"];
    $week["links"] = $week["links"] ? json_decode($week["links"], true) : [];

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

    $links = json_encode($data["links"] ?? []);

    $stmt = $db->prepare("INSERT INTO weeks (title, start_date, description, links) VALUES (?, ?, ?, ?)");
    $ok = $stmt->execute([$title, $start, $desc, $links]);

    if ($ok) {
        $newId = $db->lastInsertId();
        sendResponse(["success" => true, "week_id" => "week_" . $newId], 201);
    }

    sendError("Failed to create week", 500);
}

function updateWeek($db, $data) {
    if (empty($data["week_id"])) sendError("week_id is required");

    $weekId = $data["week_id"];
    $numericId = str_replace("week_", "", $weekId);

    $stmt = $db->prepare("SELECT * FROM weeks WHERE id = ?");
    $stmt->execute([$numericId]);
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

    $sql = "UPDATE weeks SET " . implode(", ", $fields) . " WHERE id = ?";
    $values[] = $numericId;

    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    sendResponse(["success" => true, "message" => "Week updated"]);
}

function deleteWeek($db, $weekId) {
    if (empty($weekId)) sendError("week_id required");

    $numericId = str_replace("week_", "", $weekId);

    $stmt = $db->prepare("SELECT * FROM weeks WHERE id = ?");
    $stmt->execute([$numericId]);
    if (!$stmt->fetch()) sendError("Week not found", 404);

    $stmt = $db->prepare("DELETE FROM comments_week WHERE week_id = ?");
    $stmt->execute([$numericId]);

    $stmt = $db->prepare("DELETE FROM weeks WHERE id = ?");
    $ok = $stmt->execute([$numericId]);

    if ($ok) sendResponse(["success" => true, "message" => "Week and its comments deleted"]);
    sendError("Failed to delete week", 500);
}

function getCommentsByWeek($db, $weekId) {
    if (empty($weekId)) sendError("week_id required");

    $numericId = str_replace("week_", "", $weekId);

    $stmt = $db->prepare("SELECT * FROM comments_week WHERE week_id = ? ORDER BY created_at ASC");
    $stmt->execute([$numericId]);
    $rows = $stmt->fetchAll();

    sendResponse(["success" => true, "data" => $rows]);
}

function createComment($db, $data) {
    if (empty($data["week_id"]) || empty($data["author"]) || empty($data["text"])) {
        sendError("Missing required fields");
    }

    $weekId = $data["week_id"];
    $numericId = str_replace("week_", "", $weekId);
    $author = sanitizeInput($data["author"]);
    $text   = sanitizeInput($data["text"]);

    $stmt = $db->prepare("SELECT * FROM weeks WHERE id = ?");
    $stmt->execute([$numericId]);
    if (!$stmt->fetch()) sendError("Week not found", 404);

    $stmt = $db->prepare("INSERT INTO comments_week (week_id, author, text) VALUES (?, ?, ?)");
    $ok = $stmt->execute([$numericId, $author, $text]);

    if ($ok) sendResponse(["success" => true, "comment_id" => $db->lastInsertId()], 201);

    sendError("Failed to create comment", 500);
}

function deleteComment($db, $commentId) {
    if (empty($commentId)) sendError("Missing id");

    $stmt = $db->prepare("SELECT * FROM comments_week WHERE id = ?");
    $stmt->execute([$commentId]);
    if (!$stmt->fetch()) sendError("Comment not found", 404);

    $stmt = $db->prepare("DELETE FROM comments_week WHERE id = ?");
    $ok = $stmt->execute([$commentId]);

    if ($ok) sendResponse(["success" => true, "message" => "Comment deleted"]);

    sendError("Failed to delete comment", 500);
}

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
