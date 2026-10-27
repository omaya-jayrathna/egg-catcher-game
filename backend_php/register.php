<?php
header("Content-Type:application/json");
header("Access-Control-Allow-Origin:*");
include 'db.php';

$data=json_decode(file_get_contents("php://input"),true);

if(isset($data['username'])&& isset($data['password'])){
    $username=$data['username'];
    //Hash the password for security (Virtual Identity requirement)
    $hashed_password=password_hash($data['password'],PASSWORD_DEFAULT);

    $stmt=$conn->prepare("INSERT INTO users(username,password)VALUES(?,?)");
    $stmt->bind_param("ss",$username,$hashed_password);

    if($stmt->execute()){
        echo json_encode(["success"=>true,"message"=>"User registered"]);
    }else{
        echo json_encode(["success"=>false,"message"=>"Username already taken"]);
    }

}
?>