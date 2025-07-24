const channel = new BroadcastChannel('scoreboard');
  let currentInitialShot = 24; // 🔁 Global var untuk kontrol logika tombol 14
  let isGameRunning = false;
  let isShotRunning = false;

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

    if (data.type === 'set-shot-time') {
      const shotClockEl = document.getElementById('shot-clock');
      if (shotClockEl) {
        if (data.running) {
          resetShotClock(data.value);
        } else {
          shotClockEl.textContent = data.value;
        }
      }
    }


  };
}

if (document.getElementById('team1-score')) {
  listenForUpdates();
}

// ===============================
// Logic timer & shot clock
// ===============================
let gameTimerInterval = null;
let shotClockInterval = null;
const shotClockBeep = new Audio('assets/buzzer.mp3');

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

function resetShotClock(value) {
  const shotClockEl = document.getElementById('shot-clock');
  if (!shotClockEl) return;

  clearInterval(shotClockInterval); // stop yang sedang jalan

  let shotSeconds = value;
  shotClockEl.textContent = shotSeconds;

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


document.addEventListener('DOMContentLoaded', () => {
  // ===============================
  // Untuk input.html (time controller)
  // ===============================
  const bothBtn = document.getElementById('bothBtn');
  const gameBtn = document.getElementById('gameBtn');
  const shotBtn = document.getElementById('shotBtn');
  
  const set12ShotBtn = document.getElementById('set12Shot');
  const set14ShotBtn = document.getElementById('set14Shot');
  const set24ShotBtn = document.getElementById('set24Shot');


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

    updateSetShotButtonsState();
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
      console.log('isGameRunning: ', isGameRunning);
      console.log('isShotRunning: ', isShotRunning);
      isShotRunning = !isShotRunning;
      localStorage.setItem('isShotRunning', isShotRunning);

      if (isShotRunning && !isGameRunning) {
        gameBtn.click();
      }

      if (!isShotRunning && isGameRunning) {
        bothBtn.textContent = 'Start';
      }

      updateButtonStates();

      channel.postMessage({ type: 'toggle-shot-timer', running: isShotRunning });
    });
  }

  // ===============================
  // Untuk input.html (set shot clock)
  // ===============================

  function updateSetShotButtonsState() {
    
    if (!set12ShotBtn || !set24ShotBtn || !set14ShotBtn) return;
    // Tombol 12 & 24: hanya aktif kalau timer tidak jalan
    // set12ShotBtn.disabled = isShotRunning;
    // set24ShotBtn.disabled = isShotRunning;

    // Tombol 14: hanya aktif jika shot clock tidak 12
    set14ShotBtn.disabled = currentInitialShot === 12;
  }

  if (set12ShotBtn && set14ShotBtn && set24ShotBtn) {
    updateSetShotButtonsState();

    set12ShotBtn.addEventListener('click', () => {
      currentInitialShot = 12;
      updateSetShotButtonsState();
      channel.postMessage({ type: 'set-shot-time', value: 12, running: isShotRunning });
       // Jika sedang berjalan, reset timer langsung
      if (isShotRunning) {
        resetShotClock(14);
      }
    });

    set14ShotBtn.addEventListener('click', () => {
      currentInitialShot = 14;
      updateSetShotButtonsState();
      // Tombol ini hanya bisa diklik jika currentInitialShot !== 12
      if (currentInitialShot === 12) return;
      channel.postMessage({ type: 'set-shot-time', value: 14, running: isShotRunning });
       // Jika sedang berjalan, reset timer langsung
      if (isShotRunning) {
        resetShotClock(14);
      }
    });

    set24ShotBtn.addEventListener('click', () => {
      currentInitialShot = 24;
      updateSetShotButtonsState();
      channel.postMessage({ type: 'set-shot-time', value: 24, running: isShotRunning });
       // Jika sedang berjalan, reset timer langsung
      if (isShotRunning) {
        resetShotClock(14);
      }
    });
  }

  if (window.location.pathname.endsWith('input.html')) {
    // ===============================
    // Untuk shortcut keyboard (controller)
    // ===============================
    document.addEventListener('keydown', (event) => {
      const key = event.key;

      if (key === ' ') {
        // resetShotClock(currentInitialShot);
        event.preventDefault(); // mencegah scroll saat tekan spasi
      } else if (key === '[' || key === '{') {
        gameBtn.click();
      } else if (key === ']' || key === '}') {
        shotBtn.click();
      } else if (key === 'p' || key === 'P'){
        bothBtn.click();
      }
    });
  }
});
