<?php
$conn = new mysqli("localhost", "User1", "QWE123!@#qwe", "Career_Portal");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "Database Connected Successfully!";
?>