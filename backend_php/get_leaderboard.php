<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
include 'db.php';

// Fetch the top 10 users ordered by high_score
$sql = "SELECT username, high_score FROM users WHERE high_score > 0 ORDER BY high_score DESC LIMIT 10";
$result = $conn->query($sql);

$leaderboard = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $leaderboard[] = $row;
    }
}

echo json_encode($leaderboard);
?>