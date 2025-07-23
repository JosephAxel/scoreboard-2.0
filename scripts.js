const channel = new BroadcastChannel('scoreboard');

// ===============================
// Untuk index.html (display)
// ===============================
function listenForUpdates() {
  channel.onmessage = (event) => {
    const data = event.data;

    if (data.type === 'update-score') {
      document.getElementById('team1-score').textContent = data.team1Score;
      document.getElementById('team2-score').textContent = data.team2Score;
    }

    if (data.type === 'update-foul') {
      document.getElementById('team1-foul-count').textContent = data.team1Fouls;
      document.getElementById('team2-foul-count').textContent = data.team2Fouls;
    }

    if (data.type === 'update-name') {
      document.getElementById('team1-name').textContent = data.team1Name;
      document.getElementById('team2-name').textContent = data.team2Name;
    }

    if (data.type === 'toggle-both-timer') {
      if (data.running) {
        console.log('both start')
        startTimers();
    } else {
        console.log('both stop')
        stopTimers();
    }
}

if (data.type === 'toggle-game-timer') {
    if (data.running) {
        console.log('game start')
        startGameTimer();
    } else {
        console.log('game stop')
        clearInterval(gameTimerInterval);
    }
}

if (data.type === 'toggle-shot-timer') {
    if (data.running) {
        console.log('shot start')
        startShotClock();
    } else {
        console.log('shot stop')
        clearInterval(shotClockInterval);
      }
    }
  };
}

if (document.getElementById('team1-score')) {
  listenForUpdates();
}

// ===============================
// Untuk timer & shot clock
// ===============================
let gameTimerInterval = null;
let shotClockInterval = null;
const shotClockBeep = new Audio('assets/buzzer.mp3');

function startTimers() {
  startGameTimer();
  startShotClock();
}

function stopTimers() {
  clearInterval(gameTimerInterval);
  clearInterval(shotClockInterval);
}

function startGameTimer() {
  const timerEl = document.getElementById('timer');
  if (!timerEl) return;

  // 🔧 Stop interval sebelumnya jika ada
  clearInterval(gameTimerInterval);

  let [minutes, seconds] = timerEl.textContent.split(':').map(Number);

  gameTimerInterval = setInterval(() => {
    if (seconds === 0 && minutes === 0) {
      clearInterval(gameTimerInterval);
      return;
    }

    if (seconds === 0) {
      minutes--;
      seconds = 59;
    } else {
      seconds--;
    }

    timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
}


function startShotClock() {
  const shotClockEl = document.getElementById('shot-clock');
  if (!shotClockEl) return;

  // 🔧 Stop interval sebelumnya jika ada
  clearInterval(shotClockInterval);

  let shotSeconds = parseInt(shotClockEl.textContent, 10);

  shotClockInterval = setInterval(() => {
    if (shotSeconds === 0) {
      clearInterval(shotClockInterval);

      shotClockBeep.currentTime = 0;
      shotClockBeep.play().catch(e => console.warn("Audio play blocked:", e));
      return;
    }

    shotSeconds--;
    shotClockEl.textContent = shotSeconds;
  }, 1000);
}


// ===============================
// Untuk input.html (controller)
// ===============================
const bothBtn = document.getElementById('bothBtn');
const gameBtn = document.getElementById('gameBtn');
const shotBtn = document.getElementById('shotBtn');

let isGameRunning = false;
let isShotRunning = false;

// Ambil status dari localStorage saat halaman dimuat
if (localStorage.getItem('isGameRunning') !== null) {
  isGameRunning = localStorage.getItem('isGameRunning') === 'true';
}
if (localStorage.getItem('isShotRunning') !== null) {
  isShotRunning = localStorage.getItem('isShotRunning') === 'true';
}

function updateButtonStates() {
  if (!gameBtn || !shotBtn || !bothBtn) return;

  gameBtn.textContent = isGameRunning ? 'Stop' : 'Start';
  shotBtn.textContent = isShotRunning ? 'Stop' : 'Start';

  if (isGameRunning && isShotRunning) {
    bothBtn.textContent = 'Stop';
  } else {
    bothBtn.textContent = 'Start';
  }
}

updateButtonStates();

if (bothBtn && gameBtn && shotBtn) {
  bothBtn.addEventListener('click', () => {
    const willRun = !(isGameRunning && isShotRunning);

    isGameRunning = willRun;
    isShotRunning = willRun;

    localStorage.setItem('isGameRunning', isGameRunning);
    localStorage.setItem('isShotRunning', isShotRunning);

    updateButtonStates();

    channel.postMessage({ type: 'toggle-game-timer', running: isGameRunning });
    channel.postMessage({ type: 'toggle-shot-timer', running: isShotRunning });
  });

  gameBtn.addEventListener('click', () => {
    isGameRunning = !isGameRunning;
    localStorage.setItem('isGameRunning', isGameRunning);

    if (!isGameRunning && isShotRunning) {
      bothBtn.textContent = 'Start';
    }

    updateButtonStates();

    channel.postMessage({ type: 'toggle-game-timer', running: isGameRunning });
  });

  shotBtn.addEventListener('click', () => {
    isShotRunning = !isShotRunning;
    localStorage.setItem('isShotRunning', isShotRunning);

    if (!isShotRunning && isGameRunning) {
      bothBtn.textContent = 'Start';
    }

    updateButtonStates();

    channel.postMessage({ type: 'toggle-shot-timer', running: isShotRunning });
  });
}

document.addEventListener('keydown', (event) => {
  const key = event.key;

  if (key === ' ') {
    event.preventDefault(); // mencegah scroll saat tekan spasi
    bothBtn.click();
  } else if (key === '[' || key === '{') {
    gameBtn.click();
  } else if (key === ']' || key === '}') {
    shotBtn.click();
  }
});
