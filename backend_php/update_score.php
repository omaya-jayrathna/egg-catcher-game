<?php
header("Content-Type:application/json");
header("Access-Control-Allow-Origin:*");
include 'db.php';

$data=json_decode(file_get_contents("php://input"),true);

if(isset($data['sessionId'])&& isset($data['score'])){
    $session_id=$data['sessionId'];
    $score=$data['score'];

    //Verify session is valid
    $stmt=$conn->prepare("SELECT username FROM sessions WHERE session_id=? AND expires_at >NOW()");
    $stmt->bind_param("s",$session_id);
    $stmt->execute();
    $result=$stmt->get_result();
    $session=$result->fetch_assoc();

    if($session){
        $username=$session['username'];

        //Update score if it's higher
        $stmt=$conn->prepare("UPDATE users SET high_score=? WHERE username=? AND high_score<?");
        $stmt->bind_param("isi",$score,$username,$score);
        $stmt->execute();

        echo json_encode(["success"=>true,"message"=>"Score updated"]);
    }else{
        echo json_encode(["success"=>false,"message"=>"Invalid session"]);
    }
}
?>