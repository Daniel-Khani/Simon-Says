// ========================================
// 1. SELECT HTML ELEMENTS
// ========================================

const colorButtons = document.querySelectorAll(".color-button");
const startButton = document.getElementById("start-btn");
const levelDisplay = document.getElementById("level");
const bestDisplay = document.getElementById("best");
const messageDisplay = document.getElementById("message");
const difficultySelect = document.getElementById("difficulty");
const soundButton = document.getElementById("sound-btn");
const gameContainer = document.querySelector(".game-container");

// ========================================
// 2. GAME VARIABLES
// ========================================

let sequence = [];
let playerSequence = [];

let level = 0;
let bestScore = 0;

let canClick = false;
let gameRunning = false;
let soundEnabled = true;

let timers = [];
let audioContext = null;

// ========================================
// 3. DIFFICULTY SETTINGS
// ========================================

const difficultySpeeds = {
    easy: 800,
    medium: 500,
    hard: 250
};

function getSpeed() {
    return difficultySpeeds[difficultySelect.value]
        || difficultySpeeds.medium;
}

// ========================================
// 4. LOAD BEST SCORE
// ========================================

try {
    bestScore = Number(localStorage.getItem("simonBest")) || 0;
} catch (error) {
    bestScore = 0;
}

bestDisplay.textContent = bestScore;

// ========================================
// 5. TIMER MANAGEMENT
// ========================================

function addTimer(callback, delay) {
    const timer = setTimeout(() => {
        timers = timers.filter((item) => item !== timer);
        callback();
    }, delay);

    timers.push(timer);
    return timer;
}

function clearGameTimers() {
    timers.forEach((timer) => clearTimeout(timer));
    timers = [];

    colorButtons.forEach((button) => {
        button.classList.remove("active");
    });
}

// ========================================
// 6. SOUND SYSTEM
// ========================================

function playSound(color) {
    if (!soundEnabled) return;

    const frequencies = {
        green: 329.63,
        red: 261.63,
        yellow: 392.00,
        blue: 523.25
    };

    try {
        if (!audioContext) {
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClass) return;

            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequencies[color];

        gain.gain.setValueAtTime(0.18, audioContext.currentTime);

        gain.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.22
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.22);
    } catch (error) {
        console.log("Sound is not available in this browser.");
    }
}

// ========================================
// 7. LIGHT UP A COLOR
// ========================================

function lightUpColor(color) {
    const button = document.querySelector(
        `.color-button[data-color="${color}"]`
    );

    if (!button) return;

    button.classList.add("active");
    playSound(color);

    addTimer(() => {
        button.classList.remove("active");
    }, 350);
}

// ========================================
// 8. PLAY COMPUTER SEQUENCE
// ========================================

function playSequence() {
    canClick = false;
    playerSequence = [];

    messageDisplay.textContent = "Watch the colors carefully!";

    const speed = getSpeed();

    sequence.forEach((color, index) => {
        addTimer(() => {
            if (gameRunning) {
                lightUpColor(color);
            }
        }, speed * (index + 1));
    });

    addTimer(() => {
        if (!gameRunning) return;

        canClick = true;
        messageDisplay.textContent = "Your turn! Repeat the sequence.";
    }, speed * (sequence.length + 1));
}

// ========================================
// 9. START NEXT LEVEL
// ========================================

function nextLevel() {
    if (!gameRunning) return;

    level++;
    levelDisplay.textContent = level;

    const colors = ["green", "red", "yellow", "blue"];

    const randomColor =
        colors[Math.floor(Math.random() * colors.length)];

    sequence.push(randomColor);

    playSequence();
}

// ========================================
// 10. START OR RESTART GAME
// ========================================

function startGame() {
    clearGameTimers();

    sequence = [];
    playerSequence = [];
    level = 0;

    canClick = false;
    gameRunning = true;

    gameContainer.classList.remove("game-over");

    levelDisplay.textContent = "0";
    messageDisplay.textContent = "Get ready!";

    startButton.textContent = "↻ RESTART GAME";

    nextLevel();
}

// ========================================
// 11. CHECK PLAYER'S ANSWER
// ========================================

function handleColorClick(event) {
    if (!canClick || !gameRunning) return;

    const clickedColor = event.currentTarget.dataset.color;

    lightUpColor(clickedColor);
    playerSequence.push(clickedColor);

    const currentIndex = playerSequence.length - 1;

    // Is the selected color correct?
        
    if (playerSequence.length === sequence.length) {
        canClick = false;

        // Win after correctly completing level 10
        if (level === 10) {
            victory();
            return;
        }

        messageDisplay.textContent = "Correct! Get ready...";

        addTimer(() => {
            if (gameRunning) {
                nextLevel();
            }
        }, 900);
    }

}

// ========================================
// 12. GAME OVER
// ========================================

function gameOver() {
    gameRunning = false;
    canClick = false;

    clearGameTimers();

    gameContainer.classList.remove("game-over");

    // Restart the animation cleanly.
    void gameContainer.offsetWidth;

    gameContainer.classList.add("game-over");

    messageDisplay.textContent =
        `Game Over! You reached level ${level}.`;

    if (level > bestScore) {
        bestScore = level;
        bestDisplay.textContent = bestScore;

        try {
            localStorage.setItem("simonBest", String(bestScore));
        } catch (error) {
            // The game still works if storage is unavailable.
        }

        messageDisplay.textContent += " New record! 🏆";
    }

    startButton.textContent = "▶ PLAY AGAIN";
}

// ========================================
// 13. SOUND TOGGLE
// ========================================

function toggleSound() {
    soundEnabled = !soundEnabled;

    soundButton.textContent = soundEnabled
        ? "🔊 SOUND ON"
        : "🔇 SOUND OFF";

    soundButton.setAttribute(
        "aria-pressed",
        String(soundEnabled)
    );

    if (soundEnabled) {
        // Give a short sound preview when sound is enabled.
        playSound("green");
    }
}

// ========================================
// 14. CONNECT EVENT LISTENERS
// ========================================

colorButtons.forEach((button) => {
    button.addEventListener("click", handleColorClick);
});

startButton.addEventListener("click", startGame);
soundButton.addEventListener("click", toggleSound);

// ========================================
// 15. INITIAL MESSAGE
// ========================================

messageDisplay.textContent = "Choose your difficulty and press Start!";

// ========================================
// VICTORY CELEBRATION
// ========================================

function victory() {
    gameRunning = false;
    canClick = false;

    clearGameTimers();

    gameContainer.classList.remove("game-over", "victory");
    messageDisplay.classList.remove("victory-title");

    messageDisplay.textContent = "🏆 YOU WIN! PERFECT MEMORY!";
    messageDisplay.classList.add("victory-title");

    startButton.textContent = "▶ PLAY AGAIN";

    // Save the winning score
    if (level > bestScore) {
        bestScore = level;
        bestDisplay.textContent = bestScore;

        try {
            localStorage.setItem("simonBest", String(bestScore));
        } catch (error) {
            // Game still works without storage.
        }
    }

    // Create colorful confetti
    const colors = [
        "#b84dff",
        "#ff4fa3",
        "#42ffab",
        "#fff16b",
        "#6b9dff"
    ];

    for (let i = 0; i < 100; i++) {
        const piece = document.createElement("div");

        piece.className = "confetti";
        piece.style.left = Math.random() * 100 + "vw";
        piece.style.backgroundColor =
            colors[Math.floor(Math.random() * colors.length)];

        piece.style.animationDelay =
            Math.random() * 1.5 + "s";

        piece.style.transform =
            `rotate(${Math.random() * 360}deg)`;

        document.body.appendChild(piece);

        setTimeout(() => {
            piece.remove();
        }, 5000);
    }
}
