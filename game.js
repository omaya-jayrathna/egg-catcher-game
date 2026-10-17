/*===============================
EGG CATCHER WITH BANANA BONUS
Screen Navigation+Login/Register
================================*/

//========SCREEN MANAGEMENT============

/**show a specific screen by its ID. */

function showScreen(screenId){
    //Hide all screens
    document.querySelectorAll('.screen').forEach(screen=>{
        screen.classList.remove('active');
    });

    //Hide all overlays (bonus, game over)
    document.querySelectorAll('.overlay').forEach(overlay=>{
        overlay.classList.add('hidden');
    });

    //show the requested screen
    const targetScreen =document.getElementById(screenId);
    if(targetScreen){
        targetScreen.classList.add('active');
    }
}

//=========PLAYER STATE=============
let currentPlayer={
    name:'Player',
    highScore:0,
    difficulty:'medium'
};

//===========LOGIN SCREEN==========
document.getElementById('btnLogin').addEventListener('click',()=>{
    const username=document.getElementById('loginUsername').value.trim();
    const password=document.getElementById('loginPassword').value.trim();

    if(!username || !password){
        alert('Please enter both username and password.');
        return;
    }

    const storedUser=localStorage.getItem('user_'+username);
    if(!storedUser){
        alert('User not found. Please register first.');
        return;
    }

    const user=JSON.parse(storedUser);
    if(user.password!==password){
        alert('Incorrect password.');
        return;
    }

    //Login Successful
    currentPlayer.name=user.name ||username;
    currentPlayer.highScore=user.highScore||0;

    document.getElementById('welcomeName').textContent=currentPlayer.name;
    document.getElementById('dashHighScore').textContent=currentPlayer.highScore;

    showScreen('dashboardScreen');

});

//Link to Register Screen
document.getElementById('linkToRegister').addEventListener('click',()=>{
    showScreen('registerScreen');
});

//=======REGISTER SCREEN========
document.getElementById('btnRegister').addEventListener('click',()=>{
    const name=document.getElementById('regName').value.trim();
    const username=document.getElementById('regUsername').value.trim();
    const password=document.getElementById('regPassword').value.trim();
    const confirm=document.getElementById('regConfirm').value.trim();

    if(!name || !username || !password || !confirm){
        alert('Please fill in all fields.');
        return;
    }

    if(password!==confirm){
        alert('Password do not match.');
        return;
    }

    if(password.length<4){
        alert('Password must be at least 4 characters.');
        return;
    }

    if(localStorage.getItem('user_'+username)){
        alert('Username already taken. Please choose another.');
        return;
    }

    const newUser={
        name:name,
        password:password, //will be hashed in later
        highScore:0
    };
    localStorage.setItem('user_'+username,JSON.stringify(newUser));

    currentPlayer.name=name;
    currentPlayer.highScore=0;

    document.getElementById('welcomeName').textContent=name;
    document.getElementById('dashHighScore').textContent=0;

    alert('Registration successful! Welcome,'+name+'!');

    showScreen('dashboardScreen');
});

//===========DASHBOARD SCREEN============

//DIFFICULTY SELECTION
const difficultyButtons=document.querySelectorAll('.diff-btn');

difficultyButtons.forEach(button=>{
    button.addEventListener('click',()=>{
        difficultyButtons.forEach(btn=>btn.classList.remove('active'));
        button.classList.add('active');
        currentPlayer.difficulty=button.id.replace('btn','').toLowerCase();
    });
});

//START GAME (goes to game screen)
document.getElementById('btnStartGame').addEventListener('click',()=>{
    document.getElementById('playerName').textContent=currentPlayer.name;
    document.getElementById('highScore').textContent=currentPlayer.highScore;
    showScreen('gameScreen');
});

//VIEW LEADERBOARD
document.getElementById('btnViewLeaderboard').addEventListener('click',()=>{
    showScreen('leaderboardScreen');
});

//LOGOUT
document.getElementById('linkLogout').addEventListener('click',()=>{
    showScreen('loginScreen');
});

//==========LEADERBOARD SCREEN============
document.getElementById('btnBackToMenu').addEventListener('click',()=>{
    showScreen('dashboardScreen');
});

//=======INITIAL LOAD=======
showScreen('loginScreen');



/*============================================
SESSION 2:THE GAME LOOP
Bucket movement, falling eggs,collision,score
===============================================*/

//=========GAME VARIABLES===========
const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');

let gameLoopId=null; //to store the animation frame ID
let score=0;
let lives=3;
let eggSpeed=2;
let spawnRate=60; //Frames between eggs
let frameCount=0;
let eggs=[];
let keys={ArrowLeft:false,ArrowRight:false};

//Bucket object
const bucket={
    width:120,
    height:90,
    x:0,
    y:0,
    speed:8
};

//==========CANVAS SETUP=============
function resizeCanvas(){
    //Make canvas fill the screen
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;

    //Position bucket at bottom center
    bucket.y=canvas.height-bucket.height-40;
    if(bucket.x===0){
        bucket.x=(canvas.width/2)-(bucket.width/2);
    }
}
window.addEventListener('resize',resizeCanvas);

//=============INPUT HANDLING===========
document.addEventListener('keydown',(e)=>{
    if(e.key==='ArrowLeft')keys.ArrowLeft=true;
    if(e.key==='ArrowRight')keys.ArrowRight=true;
});

document.addEventListener('keyup',(e)=>{
    if(e.key==='ArrowLeft')keys.ArrowLeft=false;
    if(e.key==='ArrowRight')keys.ArrowRight=false;
});

//=========START GAME=============
//Override the previous Start Game Listner to actually start thr gameLoop
document.getElementById('btnStartGame').replaceWith(
    document.getElementById('btnStartGame').cloneNode(true)
);

document.getElementById('btnStartGame').addEventListener('click',()=>{
    document.getElementById('playerName').textContent=currentPlayer.name;
    document.getElementById('highScore').textContent=currentPlayer.highScore;
    showScreen('gameScreen');

    //Set difficulty starts
    if(currentPlayer.difficulty==='easy'){
        eggSpeed=1.5;
        spawnRate=80;
    }else if(currentPlayer.difficulty==='hard'){
        eggSpeed=4;
        spawnRate=40;
    }else{
        eggSpeed=2.5;
        spawnRate=60;
    }
    startGameLoop();
});

//=======GAME LOOP===========
function startGameLoop(){
    //Reset game state
    score=0;
    lives=3;//All difficulties have 3 lives
    eggs=[];
    frameCount=0;

    document.getElementById('score').textContent=score;
    document.getElementById('lives').textContent=lives;

    resizeCanvas();//Make sure canvas is sized right
    if(gameLoopId) cancelAnimationFrame(gameLoopId);//stop old loop
    gameLoop();//Start new loop
}
function gameLoop(){
    //1- Update
    update();

    //2-Draw
    draw();

    //3-Request next frame
    gameLoopId=requestAnimationFrame(gameLoop);
}

function update(){
    //Move bucket
    if(keys.ArrowLeft && bucket.x>0){
        bucket.x -=bucket.speed;
    }
    if(keys.ArrowRight && bucket.x +bucket.width<canvas.width){
        bucket.x+=bucket.speed;
    }

    //Spawn eggs
    frameCount++;
    if(frameCount>=spawnRate){
        eggs.push({
            x:Math.random()*(canvas.width-40)+20,
            y:-50,
            radius:20,
            speed:eggSpeed
        });
        frameCount=0;
    }

    //Update eggs
    for(let i=eggs.length -1;i>=0;i--){
        let egg=eggs[i];
        egg.y+=egg.speed;

        //Collision with bucket -check if egg is inside bucket area
        if(
            egg.y +egg.radius>=bucket.y &&
            egg.y -egg.radius<=bucket.y +bucket.height &&
            egg.x >=bucket.x &&
            egg.x <=bucket.x +bucket.width
        ) {
            //Caught it!
            eggs.splice(i,1);
            score++;
            document.getElementById('score').textContent=score;

            //Trigger bonus round every 10 points
            if(score>0 && score %10 ===0){
                //We will add the API call
                console.log("Bonus round triggered (not implemented yet)");
            }
            continue;
        }
        //Missed (hits the ground)
        if(egg.y -egg.radius>canvas.height){
            eggs.splice(i,1);
            lives--;
            document.getElementById('lives').textContent=lives;

            if(lives<=0){
                endGame();
                return;
            }
        }
    }
}
function draw(){
    //clear canvas
    ctx.clearRect(0,0,canvas.width,canvas.height);

    //Draw eggs
    eggs.forEach(egg=>{
        ctx.beginPath();
        ctx.ellipse(egg.x,egg.y,egg.radius*0.8,egg.radius,0,0,Math.PI*2);
        ctx.fillStyle='#FFF8DC';//Cream
        ctx.fill();
        ctx.strokeStyle='#E0D5B0';
        ctx.lineWidth=2;
        ctx.stroke();
    });

    //Draw bucket
    ctx.fillStyle='#C0392B';//redmixed brown
    ctx.beginPath();
    ctx.roundRect(bucket.x,bucket.y,bucket.width,bucket.height,[0,0,20,20]);
    ctx.fill();

    //Draw Bucket Rim
    ctx.fillStyle='#F39C12';//Orange
    ctx.fillRect(bucket.x -5,bucket.y,bucket.width+10,15);
}

//=============END GAME===========
function endGame(){
    cancelAnimationFrame(gameLoopId);

    //Update high score 
    if(score>currentPlayer.highScore){
        currentPlayer.highScore=score;

        //Save to LocalStorage
        const storedUser=localStorage.getItem('user_'+currentPlayer.name);
        if(storedUser){
            const user=JSON.parse(storedUser);
            user.highScore=currentPlayer.highScore;
            localStorage.setItem('user_'+currentPlayer.name,JSON.stringify(user));
        }
    }
    //Fill Game Over Screen
    document.getElementById('finalScore').textContent=score;
    document.getElementById('overHighScore').textContent=currentPlayer.highScore;
    document.getElementById('overName').textContent=currentPlayer.name;

    //Show overlay
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

//==========GAME OVER BUTTONS========
document.getElementById('btnPlayAgain').addEventListener('click',()=>{
    document.getElementById('gameOverScreen').classList.add('hidden');
    startGameLoop();
});

document.getElementById('btnBackToMenuFromGame').addEventListener('click',()=>{
    document.getElementById('gameOverScreen').classList.add('hidden');
    showScreen('dashboardScreen');
});

document.getElementById('btnViewLeaderboardFromGame').addEventListener('click',()=>{
    document.getElementById('gameOverScreen').classList.add('hidden');
    showScreen('leaderboardScreen');
});

//========INITIAL LOAD=======
showScreen('loginScreen');



