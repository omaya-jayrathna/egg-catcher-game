/*===============================
EGG CATCHER WITH BANANA BONUS
Screen Navigation+Login/Register
================================*/

/*BACKGROUND MUSIC 
*Source :Mixkit*/

let bgMusic=new Audio('assets/bgm.mp3');
bgMusic.loop=true;
bgMusic.volume=0.3;

// ============ CUSTOM POPUP LOGIC ============
function showPopup(title, message, isError = false) {
    const popup = document.getElementById('customPopup');
    const popupTitle = document.getElementById('popupTitle');
    const popupMessage = document.getElementById('popupMessage');
    const popupBtn = document.getElementById('popupBtn');

    popupTitle.textContent = title;
    popupMessage.textContent = message;
    
    if (isError) {
        popupTitle.style.color = '#C0392B'; // Red for errors
    } else {
        popupTitle.style.color = '#1E3A5F'; // Blue for success
    }

    popup.classList.remove('hidden');
    
    // When OK is clicked, hide the popup
    popupBtn.onclick = () => {
        popup.classList.add('hidden');
    };
}



//========SCREEN MANAGEMENT============
function showScreen(screenId){
    document.querySelectorAll('.screen').forEach(screen=>{
        screen.classList.remove('active');
    });
    document.querySelectorAll('.overlay').forEach(overlay=>{
        overlay.classList.add('hidden');
    });
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
document.getElementById('btnLogin').addEventListener('click',async()=>{
    const username=document.getElementById('loginUsername').value.trim();
    const password=document.getElementById('loginPassword').value.trim();

    if(!username || !password){
        alert('Please enter both username and password.');
        return;
    }

   const response=await fetch('http://localhost/eggcatcher_api/login.php',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username,password})
   });
   const data=await response.json();

   if(data.success){
    //Save session ID in a Cookie(SESSION MANAGEMENT)
    document.cookie=`sessionId=${data.sessionId}; max-age=86400; path=/`;

    currentPlayer.name=data.username;
    currentPlayer.highScore=data.highScore;
   
    document.getElementById('welcomeName').textContent=currentPlayer.name;
    document.getElementById('dashHighScore').textContent=currentPlayer.highScore;
    showScreen('dashboardScreen');

   }else{
    alert(data.message);
   }
});

//Link to Register Screen
document.getElementById('linkToRegister').addEventListener('click',()=>{
    showScreen('registerScreen');
});

//=======REGISTER SCREEN========
document.getElementById('btnRegister').addEventListener('click',async()=>{
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

    const response=await fetch('http://localhost/eggcatcher_api/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

     const data = await response.json();

    if (data.success) {
        alert("Registration successful! Please login.");
        showScreen('loginScreen');
    } else {
        alert(data.message);
    }
});



document.getElementById('linkToLogin').addEventListener('click',()=>showScreen('loginScreen'));

//===========DASHBOARD SCREEN============
const difficultyButtons=document.querySelectorAll('.diff-btn');
difficultyButtons.forEach(button=>{
    button.addEventListener('click',()=>{
        difficultyButtons.forEach(btn=>btn.classList.remove('active'));
        button.classList.add('active');
        currentPlayer.difficulty=button.id.replace('btn','').toLowerCase();
    });
});

document.getElementById('btnViewLeaderboard').addEventListener('click',async()=>{
    showScreen('leaderboardScreen');

    const leaderboardRows=document.getElementById('leaderboardRows');
    leaderboardRows.innerHTML= '<p style="color:#666; text-align:center;">Loading scores...</p>';

    try{
        const response=await fetch('http://localhost/eggcatcher_api/get_leaderboard.php');
        const data=await response.json();

        leaderboardRows.innerHTML='';//Clear loading text

        if(data.length===0){
            leaderboardRows.innerHTML= '<p style="color:#666; text-align:center;">No scores yet!</p>';
            return;
        }
        //Create the rows dynamically
        data.forEach((player,index)=>{
            const rank=index+1;
            let rowClass='blue';//Default color

            if(rank===1)rowClass='gold';
            else if(rank===2)rowClass='silver';
            else if(rank===3)rowClass='bronze';

            //Highlight the current player
            if(player.username===currentPlayer.name){
                rowClass='you';
            }
            const row=document.createElement('div');
            row.className=`lb-row ${rowClass}`;
            row.innerHTML = `
                <span class="lb-rank">#${rank}</span>
                <span class="lb-name">${player.username}</span>
                <span class="lb-score">${player.high_score}</span>
            `;
            leaderboardRows.appendChild(row);
        });
    }catch(error){
        console.error("Leaderboard Error:",error);
         leaderboardRows.innerHTML = '<p style="color:red; text-align:center;">Failed to load scores.</p>';
    }
});

document.getElementById('linkLogout').addEventListener('click',()=>{
    showScreen('loginScreen');
});

document.getElementById('btnBackToMenu').addEventListener('click',()=>{
    showScreen('dashboardScreen');
});

//=======INITIAL LOAD=======
showScreen('loginScreen');


/*============================================
SESSION 2:THE GAME LOOP
===============================================*/
const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');

let gameLoopId=null;
let score=0;
let lives=3;
let isGameOver=false;
let eggSpeed=2;
let spawnRate=60;
let frameCount=0;
let eggs=[];
let keys={ArrowLeft:false,ArrowRight:false};

const bucket={ width:120, height:90, x:0, y:0, speed:8 };

function resizeCanvas(){
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
    bucket.y=canvas.height-bucket.height-40;
    if(bucket.x===0){
        bucket.x=(canvas.width/2)-(bucket.width/2);
    }
}
window.addEventListener('resize',resizeCanvas);

document.addEventListener('keydown',(e)=>{
    if(e.key==='ArrowLeft')keys.ArrowLeft=true;
    if(e.key==='ArrowRight')keys.ArrowRight=true;
});

document.addEventListener('keyup',(e)=>{
    if(e.key==='ArrowLeft')keys.ArrowLeft=false;
    if(e.key==='ArrowRight')keys.ArrowRight=false;
});

//=========START GAME=============
document.getElementById('btnStartGame').replaceWith(
    document.getElementById('btnStartGame').cloneNode(true)
);

document.getElementById('btnStartGame').addEventListener('click',()=>{
    document.getElementById('playerName').textContent=currentPlayer.name;
    document.getElementById('highScore').textContent=currentPlayer.highScore;
    showScreen('gameScreen');

    bgMusic.currentTime=0;
    bgMusic.play();

    if(currentPlayer.difficulty==='easy'){ eggSpeed=1.0; spawnRate=120; }
    else if(currentPlayer.difficulty==='hard'){ eggSpeed=4.0; spawnRate=40; }
    else{ eggSpeed=2.5; spawnRate=60; }

    startGameLoop();
});

//=======GAME LOOP===========
function startGameLoop(){
    score=0;
    lives=3;
    isGameOver=false;
    eggs=[];
    frameCount=0;

    document.getElementById('score').textContent=score;
    document.getElementById('livesNumber').textContent=3;
    
    // UPDATE HIGH SCORE ON SCREEN
    document.getElementById('highScore').textContent=currentPlayer.highScore;

    const hearts=document.querySelectorAll('.life-heart');
    hearts.forEach(heart=>{
        heart.classList.remove('lost');
        heart.textContent='❤️';
    });

    resizeCanvas();
    if(gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoop();
}

function gameLoop(){
    if(isGameOver) return;

    update();
    draw();
    gameLoopId=requestAnimationFrame(gameLoop);
}

function update(){
    if(keys.ArrowLeft && bucket.x>0){
        bucket.x -=bucket.speed;
    }
    if(keys.ArrowRight && bucket.x +bucket.width<canvas.width){
        bucket.x+=bucket.speed;
    }

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

    for(let i=eggs.length -1;i>=0;i--){
        let egg=eggs[i];
        egg.y+=egg.speed;

        if(egg.y +egg.radius>=bucket.y && egg.y -egg.radius<=bucket.y +bucket.height && egg.x >=bucket.x && egg.x <=bucket.x +bucket.width) {
            //caught it
            eggs.splice(i,1);
            score++;
            document.getElementById('score').textContent=score;

            playSound('catch');

            if(score>0 && score %5 ===0){
                isGameOver=true;
                triggerBonusRound();
                return;
            }
            continue;
        }
        
        if(egg.y -egg.radius>canvas.height){
            eggs.splice(i,1);
            if(isGameOver)return;

            lives--;
            document.getElementById('livesNumber').textContent=lives;
            const hearts=document.querySelectorAll('.life-heart');
            if(hearts[lives]){
                hearts[lives].classList.add('lost');
            }
            if(lives<=0){
                isGameOver=true;
                endGame();
                return;
            }
        }
    }
}

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    eggs.forEach(egg=>{
        ctx.beginPath();
        ctx.ellipse(egg.x,egg.y,egg.radius*0.8,egg.radius,0,0,Math.PI*2);
        ctx.fillStyle='#FFF8DC';
        ctx.fill();
        ctx.strokeStyle='#E0D5B0';
        ctx.lineWidth=2;
        ctx.stroke();
    });

    ctx.fillStyle='#C0392B';
    ctx.beginPath();
    ctx.roundRect(bucket.x,bucket.y,bucket.width,bucket.height,[0,0,20,20]);
    ctx.fill();

    ctx.fillStyle='#F39C12';
    ctx.fillRect(bucket.x -5,bucket.y,bucket.width+10,15);
}

//=============END GAME===========
function endGame(){
    cancelAnimationFrame(gameLoopId);

    playSound('gameover');
    bgMusic.pause();

    // 1. Send score to PHP Backend
    const sessionId = document.cookie.split('; ').find(row => row.startsWith('sessionId='))?.split('=')[1];
    if (sessionId) {
        fetch('http://localhost/eggcatcher_api/update_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: sessionId, score: score })
        }).then(() => {
            // After saving the score, fetch the leaderboard to find the rank
            calculateRank();
        });
    } else {
        calculateRank(); // If no session, just calculate rank anyway
    }

    // 2. Update Local State
    if(score > currentPlayer.highScore){
        currentPlayer.highScore = score;
    }

    // 3. Update Game Over Screen
    document.getElementById('finalScore').textContent = score;
    document.getElementById('overHighScore').textContent = currentPlayer.highScore;
    document.getElementById('overName').textContent = currentPlayer.name;

    // 4. Show Overlay
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// New function to calculate the rank
async function calculateRank() {
    try {
        const response = await fetch('http://localhost/eggcatcher_api/get_leaderboard.php');
        const data = await response.json();
        
        let rank = "#-";
        for (let i = 0; i < data.length; i++) {
            if (data[i].username === currentPlayer.name) {
                rank = `#${i + 1}`;
                break;
            }
        }
        document.getElementById('finalRank').textContent = rank;
    } catch (error) {
        console.error("Could not calculate rank", error);
    }
}


//==========GAME OVER BUTTONS========
document.getElementById('btnPlayAgain').addEventListener('click',()=>{
    document.getElementById('gameOverScreen').classList.add('hidden');
    startGameLoop();

    bgMusic.currentTime=0;
    bgMusic.play();
});

document.getElementById('btnBackToMenuFromGame').addEventListener('click',()=>{
    document.getElementById('gameOverScreen').classList.add('hidden');
    showScreen('dashboardScreen');
});

document.getElementById('btnViewLeaderboardFromGame').addEventListener('click',()=>{
    document.getElementById('gameOverScreen').classList.add('hidden');
    showScreen('leaderboardScreen');
});

//=======EXIT BUTTON LOGIC=========
document.getElementById('btnExit').addEventListener('click',()=>{
    if(gameLoopId) cancelAnimationFrame(gameLoopId);

    const confirmExit=confirm("Are you sure you want to exit?Your current progress will be lost.");

    if(confirmExit){
        bgMusic.pause();
    }

    if(confirmExit){
        eggs=[];
        showScreen('dashboardScreen');
    }else{
        gameLoop();
    }
});

//============BANANA API (INTEROPERABILITY)============
async function triggerBonusRound(){
    if(gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null; 
    }

    const bonusScreen = document.getElementById('bonusScreen');
    const puzzleImage = document.getElementById('puzzleImage');
    const answerButtons = document.getElementById('answerButtons');

    bonusScreen.classList.remove('hidden');
    answerButtons.innerHTML = 'Loading...'; 
    puzzleImage.src = '';

    try{
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); 

        // Fetch the REAL API directly
        const response = await fetch('https://marcconrad.com/uob/banana/api.php?out=json&base64=yes', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        // 1. Load the image
        puzzleImage.src = 'data:image/png;base64,' + data.question;
        
        // 2. Clear loading text
        answerButtons.innerHTML = '';
        
        // 3. Get the correct answers from the API
        let correctAnswers = data.solution;
        if (typeof correctAnswers === 'string') {
            correctAnswers = correctAnswers.split(',').map(s => s.trim());
        } else if (!Array.isArray(correctAnswers)) {
            correctAnswers = [correctAnswers]; 
        }
        
        // Ensure we have a correct answer as a string to check against
        const primaryCorrectAnswer = String(correctAnswers[0]);

        // 4. Generate 4 unique options (1 correct, 3 wrong)
        let options = [primaryCorrectAnswer];
        
        // Add random wrong answers around the correct one
        while(options.length < 4) {
            // Generate a random number close to the correct answer
            let wrongAnswer = String(Math.max(0, parseInt(primaryCorrectAnswer) + Math.floor(Math.random() * 7) - 3));
            
            // Only add if it's not already in the options (keeps them unique)
            if (!options.includes(wrongAnswer)) {
                options.push(wrongAnswer);
            }
        }

        // 5. Shuffle the options so the correct one isn't always first
        options.sort(() => Math.random() - 0.5);

        // 6. Create the buttons with the actual numbers
        options.forEach(num => {
            const btn = document.createElement('button');
            btn.textContent = num;
            btn.onclick = () => checkBonusAnswer(num, correctAnswers);
            answerButtons.appendChild(btn);
        });

    } catch(error){
        console.error("API Error:", error);
        showPopup("Failed to load the real Banana API. The game will resume.");
        bonusScreen.classList.add('hidden');
        isGameOver = false;
        gameLoop(); 
    }
}

// Helper function for correct answers
function handleCorrectAnswer() {
    const bonusScreen = document.getElementById('bonusScreen');
    bonusScreen.classList.add('hidden');

    score += 5;
    document.getElementById('score').textContent = score;

    playSound('bonus');
    
    // IF PLAYER HAS LESS THAN 3 LIVES, GIVE ONE BACK
    if (lives < 3) {
        lives++;
        document.getElementById('livesNumber').textContent = lives;
        const hearts = document.querySelectorAll('.life-heart');
        if (hearts[lives - 1]) {
            hearts[lives - 1].classList.remove('lost');
        }
        showPopup("Correct!", "🍌 +5 Bonus Points AND +1 Life Restored!");
    } else {
        showPopup("Correct!", "🍌 +5 Bonus Points!");
    }

    eggs = []; 
    frameCount = 0;
    isGameOver = false;
    gameLoop();
}

// Helper function for wrong answers
function handleWrongAnswer() {
    const bonusScreen = document.getElementById('bonusScreen');
    bonusScreen.classList.add('hidden');

    lives--;
    score -= 5; 
    if (score < 0) score = 0; // Prevent negative score

    document.getElementById('livesNumber').textContent = lives;
    document.getElementById('score').textContent = score;

    const hearts = document.querySelectorAll('.life-heart');
    if (hearts[lives]) {
        hearts[lives].classList.add('lost');
    }
    
    playSound('wrong');

    showPopup("Wrong Answer", "❌ -1 Life and -5 Points.", true);

    if (lives <= 0) {
        isGameOver = true;
        endGame();
        return;
    }
    
    eggs = []; 
    frameCount = 0;
    isGameOver = false;
    gameLoop();
}

// This checks the answer
function checkBonusAnswer(selected, correctAnswers){
    // Convert both to strings to ensure they match (e.g., "2" == "2")
    const isCorrect = correctAnswers.some(ans => String(ans) === String(selected));
    
    if(isCorrect){
        handleCorrectAnswer();
    } else {
        handleWrongAnswer();
    }
}

//=============SOUND API ===============
async function playSound(type){
    let soundUrl='';

    if(type==='catch'){
        soundUrl='https://actions.google.com/sounds/v1/cartoon/pop.ogg'; 

    }else if(type==='bonus'){
        soundUrl='https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg';

    }else if(type==='wrong'){
        soundUrl='https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=error-126627.mp3'; 

    }else if(type==='gameover'){
        soundUrl='https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=error-126627.mp3'; 
    }

    if(!soundUrl)return;

    try{
        const response=await fetch(soundUrl);
        const blob=await response.blob();
        const audioUrl=URL.createObjectURL(blob);
        const audio=new Audio(audioUrl);
        audio.play();
    }catch(error){
        console.log("Sound API failed to load",error);
    }
}