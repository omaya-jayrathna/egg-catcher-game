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


