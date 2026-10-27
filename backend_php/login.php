<?php
header("Content-Type:application/json");
header("Access-Control-Allow-Origin:*");
include 'db.php';

$data=json_decode(file_get_contents("php://input"),true);

if(isset($data['username'])&& isset($data['password'])){
    $username=$data['username'];
    $password=$data['password'];

    $stmt=$conn->prepare("SELECT * FROM users WHERE username=?");
    $stmt->bind_param("s",$username);
    $stmt->execute();
    $result=$stmt->get_result();
    $user=$result->fetch_assoc();

    if($user && password_verify($password,$user['password'])){
        //Generate Session ID
        $session_id=bin2hex(random_bytes(16));
        $expires_at=date('Y-m-d H:i:s', strtotime('+1 day'));

        //Save session in database
        $stmt=$conn->prepare("INSERT INTO sessions(session_id,username,expires_at)VALUES(?,?,?)");
        $stmt->bind_param("sss",$session_id,$username,$expires_at);
        $stmt->execute();

        echo json_encode([
            "success"=>true,
            "sessionId"=>$session_id,
            "username"=>$username,
            "highScore"=>$user['high_score']
        ]);
    }else{
        echo json_encode(["success"=>false,"message"=>"Invalid credentials"]);
    }
    
}
?>