<?php
class Database {

    private $host = "localhost";
    private $db_name = "course";
    private $username = "admin";
    private $password = "password123";
    private $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8",
                $this->username,
                $this->password
            );

            // PDO Settings
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->conn->setAttribute(PDO::ATTR_PERSISTENT, true);

        } catch (PDOException $exception) {
            // Do NOT echo errors in production API
            error_log("Database Connection Error: " . $exception->getMessage());
            return null;
        }

        return $this->conn;
    }
}
?>
