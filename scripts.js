const channel = new BroadcastChannel('scoreboard');
let currentInitialShot = 12;
let currentPeriod = 1;
let isGameRunning = false;
let isShotRunning = false;
let homeName = 'HOME';
let awayName = 'AWAY';
let homeScore = 0;
let awayScore = 0;
let homeFoul = 0;
let awayFoul = 0;
let currentGameTime = 0;
let currentShotClock = 0;
let gameTimerInterval = null;
let shotClockInterval = null;
const shotClockBeep = new Audio('assets/buzzer.mp3');

function adjustFontSize(element) {
  const maxFontSize = 4.68; 
  let fontSize = maxFontSize;

  element.style.fontSize = fontSize + "em";

  const originalWhiteSpace = element.style.whiteSpace;
  const originalOverflow = element.style.overflow;

  element.style.whiteSpace = 'nowrap';
  element.style.overflow = 'hidden';

  while (element.scrollWidth > element.clientWidth && fontSize > 0) {
    fontSize -= 0.5;
    element.style.fontSize = fontSize + "em";
  }

  element.style.whiteSpace = originalWhiteSpace;
  element.style.overflow = originalOverflow;
}



// ===============================
// Untuk index.html (display)
// ===============================
function listenForUpdates() {
  channel.onmessage = (event) => {
    const data = event.data;

    if (data.type === 'reset') {
      // Hapus semua data dari localStorage
      localStorage.clear();
      location.reload();
    }

    if (data.type === 'adjust-period') {
      const periodElement = document.getElementById('period');
      adjustPeriod(periodElement, data.delta);
      localStorage.setItem('period', periodElement.textContent);
    }


    if (data.type === 'adjust-home-score') {
      const homeScoreElement = document.getElementById('team1-score');
      adjustScore(homeScoreElement, data.delta);
      localStorage.setItem('homeScore', homeScoreElement.textContent);
    }

    if (data.type === 'adjust-home-foul') {
      const homeFoulElement = document.getElementById('team1-foul-count');
      adjustFoul(homeFoulElement, data.delta);
      localStorage.setItem('homeFoul', homeFoulElement.textContent);
    }

    if (data.type === 'adjust-away-score') {
      const awayScoreElement = document.getElementById('team2-score');
      adjustScore(awayScoreElement, data.delta);
      localStorage.setItem('awayScore', awayScoreElement.textContent);
    }

    if (data.type === 'adjust-away-foul') {
      const awayFoulElement = document.getElementById('team2-foul-count');
      adjustFoul(awayFoulElement, data.delta);
      localStorage.setItem('awayFoul', awayFoulElement.textContent);
    }

    if (data.type === 'update-team-name') {
      if (data.team === 'home') {
        const teamNameElement = document.getElementById('team1-name');
        updateTeamName(teamNameElement, data.name);
      } else if (data.team === 'away') {
        const teamNameElement = document.getElementById('team2-name');
        updateTeamName(teamNameElement, data.name);
      }
    }

    if (data.type === 'toggle-game-timer') {
      if (data.running) {
        startGameTimer();
      } else {
        clearInterval(gameTimerInterval);
      }
    }

    if (data.type === 'toggle-shot-timer') {
      if (data.running) {
        startOrResetShotClock();
      } else {
        clearInterval(shotClockInterval);
      }
    }

    if (data.type === 'set-shot-time') {
      const shotClockEl = document.getElementById('shot-clock');
      if (shotClockEl) {
        if (data.running) {
          startOrResetShotClock(data.value);
        } else {
          localStorage.setItem('currentShotClock', data.value);
          criticalShotClock(shotClockEl, data.value);
        }
      }
    }

    if (data.type === 'adjust-shot-time') {
      const shotClockEl = document.getElementById('shot-clock');
      if (!shotClockEl) return;

      let seconds = parseInt(shotClockEl.textContent, 10);
      seconds += data.delta;

      if (seconds < 0) seconds = 0;
      
      localStorage.setItem('currentShotClock', seconds);
      criticalShotClock(shotClockEl, seconds);
    }

    if (data.type === 'adjust-game-time') {
      const timerEl = document.getElementById('timer');
      if (!timerEl) return;

      let [minutes, seconds] = timerEl.textContent.split(':').map(Number);
      let totalSeconds = minutes * 60 + seconds + data.delta;

      if (totalSeconds < 0) totalSeconds = 0;

      const newMinutes = Math.floor(totalSeconds / 60);
      const newSeconds = totalSeconds % 60;

      const timeStr = `${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}`;
      timerEl.textContent = timeStr;
      localStorage.setItem('currentGameTime', timeStr);
    }


  };
}

function loadLocalStorage(){
  const teamHomeName = document.getElementById('team1-name');
  const teamAwayName = document.getElementById('team2-name');
  const homeScoreElement = document.getElementById('team1-score');
  const awayScoreElement = document.getElementById('team2-score');
  const homeFoulElement = document.getElementById('team1-foul-count');
  const awayFoulElement = document.getElementById('team2-foul-count');
  const timerEl = document.getElementById('timer');
  const shotClockEl = document.getElementById('shot-clock');
  const periodElement = document.getElementById('period');

  if (localStorage.getItem('homeName') !== null) {
    homeName = localStorage.getItem('homeName');  
    updateTeamName(teamHomeName, homeName);
  }


  if (localStorage.getItem('awayName') !== null) {
    awayName = localStorage.getItem('awayName');  
    updateTeamName(teamAwayName, awayName);
  }

  if (localStorage.getItem('homeScore') !== null) {
    homeScore = parseInt(localStorage.getItem("homeScore"), 10);
    adjustScore(homeScoreElement, homeScore);
  }

  if (localStorage.getItem('awayScore') !== null) {
    awayScore = parseInt(localStorage.getItem("awayScore"), 10);
    adjustScore(awayScoreElement, awayScore);
  }

  if (localStorage.getItem('homeFoul') !== null) {
    homeFoul = parseInt(localStorage.getItem("homeFoul"), 10);
    adjustFoul(homeFoulElement, homeFoul);
  }

  if (localStorage.getItem('awayFoul') !== null) {
    awayFoul = parseInt(localStorage.getItem("awayFoul"), 10);
    adjustFoul(awayFoulElement, awayFoul);
  }

  if (localStorage.getItem('isGameRunning') !== null) {
    isGameRunning = localStorage.getItem('isGameRunning') === 'true';
  }
  if (localStorage.getItem('isShotRunning') !== null) {
    isShotRunning = localStorage.getItem('isShotRunning') === 'true';
  }
  if (localStorage.getItem('period') !== null) {
    currentPeriod = parseInt(localStorage.getItem("period"), 10);
    adjustFoul(periodElement, currentPeriod);
  }

  if (localStorage.getItem('currentGameTime') !== null) {
    currentGameTime = localStorage.getItem('currentGameTime');
    if (timerEl) timerEl.textContent = currentGameTime;
    if (isGameRunning) {
        startGameTimer();
      } else {
        clearInterval(gameTimerInterval);
      }
  }

  if (localStorage.getItem('currentShotClock') !== null) {
    currentShotClock = localStorage.getItem('currentShotClock');
    if (shotClockEl) shotClockEl.textContent = currentShotClock;
    if (isShotRunning) {
        startOrResetShotClock(currentShotClock);
      } else {
        criticalShotClock(shotClockEl, currentShotClock);
      }
  }
}

function updateTeamName(element, value){
  if (element){
      element.textContent = value.toUpperCase();
      adjustFontSize(element);
    }
}

function adjustScore(element, delta){
  if (element){
    let score = parseInt(element.textContent, 10);
    score += delta;

    if (score < 0) score = 0;
    element.textContent = score;
  }
}

function adjustFoul(element, delta){
  if (element) {
    let foul = parseInt(element.textContent, 10);
    foul += delta;

    if (foul < 0) foul = 0;
    criticalFoul(element, foul);
  }
}

function adjustPeriod(element, delta){
  if (element) {
    let period = parseInt(element.textContent, 10);
    period += delta;

    if (period < 1) period = 1;
    if (period > 4) period = 4;
    element.textContent = period;
  }
}

if (document.getElementById('team1-score')) {
  loadLocalStorage();
  listenForUpdates();
}

// ===============================
// Logic timer & shot clock
// ===============================


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

    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    timerEl.textContent = timeStr;
    localStorage.setItem('currentGameTime', timeStr);
  }, 1000);
}

function startOrResetShotClock(value = null) {
  const shotClockEl = document.getElementById('shot-clock');
  if (!shotClockEl) return;

  clearInterval(shotClockInterval);

  // Ambil dari parameter jika ada, jika tidak ambil dari textContent
  let shotSeconds = value !== null ? value : parseInt(shotClockEl.textContent, 10);

  criticalShotClock(shotClockEl, shotSeconds); // update awal sebelum interval mulai

  shotClockInterval = setInterval(() => {
    if (shotSeconds === 0) {
      clearInterval(shotClockInterval);
      channel?.postMessage?.({ type: 'shot-clock-zero' });
      shotClockBeep.currentTime = 0;
      shotClockBeep.play().catch(e => console.warn("Audio play blocked:", e));
      return;
    }

    shotSeconds--;
    criticalShotClock(shotClockEl, shotSeconds);
    localStorage.setItem('currentShotClock', shotSeconds);
  }, 1000);
}

function criticalShotClock(element, score) {
  element.textContent = score < 10 ? `0${score}` : score;
  if (score <= 5) {
    element.classList.add('red');
  } else {
    element.classList.remove('red');
  }
}

function criticalFoul(element, foul) {
  element.textContent = foul;
  if (foul >= 5) {
    element.classList.add('red');
  } else {
    element.classList.remove('red');
  }
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

  const add1ShotBtn = document.getElementById('add1Shot');
  const sub1ShotBtn = document.getElementById('sub1Shot');

  const add1GameBtn = document.getElementById('add1Game');
  const sub1GameBtn = document.getElementById('sub1Game');
  const add30GameBtn = document.getElementById('add30Game');
  const sub30GameBtn = document.getElementById('sub30Game');

  const teamHomeInput = document.getElementById('teamHomeInput');
  const teamAwayInput = document.getElementById('teamAwayInput');
  const add1ScoreHomeBtn = document.getElementById('hsp1');
  const add2ScoreHomeBtn = document.getElementById('hsp2');
  const add3ScoreHomeBtn = document.getElementById('hsp3');
  const sub1ScoreHomeBtn = document.getElementById('hsm1');
  const sub2ScoreHomeBtn = document.getElementById('hsm2');
  const sub3ScoreHomeBtn = document.getElementById('hsm3');
  const add1FoulHomeBtn = document.getElementById('hfp1');
  const sub1FoulHomeBtn = document.getElementById('hfm1');

  const add1ScoreAwayBtn = document.getElementById('asp1');
  const add2ScoreAwayBtn = document.getElementById('asp2');
  const add3ScoreAwayBtn = document.getElementById('asp3');
  const sub1ScoreAwayBtn = document.getElementById('asm1');
  const sub2ScoreAwayBtn = document.getElementById('asm2');
  const sub3ScoreAwayBtn = document.getElementById('asm3');
  const add1FoulAwayBtn = document.getElementById('afp1');
  const sub1FoulAwayBtn = document.getElementById('afm1');
  const add1PeriodBtn = document.getElementById('pp1');
  const sub1PeriodBtn = document.getElementById('pm1');

  const resetButton = document.getElementById('resetButton');

  function setupInputLock(input, buttonId, iconId) {
    const button = document.getElementById(buttonId);
    const icon = document.getElementById(iconId);

    if (button) {
      button.addEventListener("click", () => {
        const isDisabled = input.disabled;
        input.disabled = !isDisabled;
        icon.src = isDisabled ? "assets/unlock.png" : "assets/lock.png";
      });
    }
  }

  setupInputLock(teamHomeInput, "teamHomeLockBtn", "teamHomeLockIcon");
  setupInputLock(teamAwayInput, "teamAwayLockBtn", "teamAwayLockIcon");


  if (localStorage.getItem('isGameRunning') !== null) {
    isGameRunning = localStorage.getItem('isGameRunning') === 'true';
  }
  if (localStorage.getItem('isShotRunning') !== null) {
    isShotRunning = localStorage.getItem('isShotRunning') === 'true';
  }

  if (localStorage.getItem('homeName') !== null) {
    homeName = localStorage.getItem('homeName');
    if (teamHomeInput){
      teamHomeInput.value = homeName;
    }
  }

  if (localStorage.getItem('awayName') !== null) {
    awayName = localStorage.getItem('awayName');
    if (teamAwayInput) {
      teamAwayInput.value = awayName;
    }
  }

  if (localStorage.getItem('currentInitialShot') !== null) {
    currentInitialShot = parseInt(localStorage.getItem('currentInitialShot'), 10);
    updateSetShotButtonsState();
  }

  function updateSetShotButtonsState() {
    if (!set12ShotBtn || !set24ShotBtn || !set14ShotBtn) return;
    set14ShotBtn.disabled = currentInitialShot === 12;
  }

  function updateAddSubShotButtonsState() {
    if (add1ShotBtn && sub1ShotBtn) {
      add1ShotBtn.disabled = isShotRunning;
      sub1ShotBtn.disabled = isShotRunning;
    }
  }

  function updateAddSubGameButtonsState() {
    if (add1GameBtn && sub1GameBtn && add30GameBtn && sub30GameBtn) {
      add1GameBtn.disabled = isGameRunning;
      sub1GameBtn.disabled = isGameRunning;
      add30GameBtn.disabled = isGameRunning;
      sub30GameBtn.disabled = isGameRunning;
    }
  }

  function updateButtonStates() {
    if (!gameBtn || !shotBtn || !bothBtn) return;

    gameBtn.textContent = isGameRunning ? 'Stop' : 'Start';
    shotBtn.textContent = isShotRunning ? 'Stop' : 'Start';
    bothBtn.textContent = (isGameRunning && isShotRunning) ? 'Stop' : 'Start';

    updateSetShotButtonsState();
    updateAddSubShotButtonsState();
    updateAddSubGameButtonsState();
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

  if (set12ShotBtn && set14ShotBtn && set24ShotBtn) {
    set12ShotBtn.addEventListener('click', () => {
      currentInitialShot = 12;
      localStorage.setItem('currentInitialShot', currentInitialShot);
      updateSetShotButtonsState();
      channel.postMessage({ type: 'set-shot-time', value: 12, running: isShotRunning });
      if (isShotRunning) startOrResetShotClock(12);
    });

    set14ShotBtn.addEventListener('click', () => {
      currentInitialShot = 14;
      localStorage.setItem('currentInitialShot', currentInitialShot);
      updateSetShotButtonsState();
      if (currentInitialShot === 12) return;
      channel.postMessage({ type: 'set-shot-time', value: 14, running: isShotRunning });
      if (isShotRunning) startOrResetShotClock(14);
    });

    set24ShotBtn.addEventListener('click', () => {
      currentInitialShot = 24;
      localStorage.setItem('currentInitialShot', currentInitialShot);
      updateSetShotButtonsState();
      channel.postMessage({ type: 'set-shot-time', value: 24, running: isShotRunning });
      if (isShotRunning) startOrResetShotClock(24);
    });
  }

  function setupDynamicHoldButton(button, type, delta, keyShortcut = null) {
    let isHolding = false;
    let holdStartTime = 0;
    let timeoutId = null;

    const MIN_INTERVAL = 80;
    const MAX_INTERVAL = 400;

    const calculateInterval = (durationHeld) => {
      const elapsed = durationHeld;
      const interval = MAX_INTERVAL - Math.min((elapsed / 1000) * 250, MAX_INTERVAL - MIN_INTERVAL);
      return Math.max(MIN_INTERVAL, interval);
    };

    const repeatAction = () => {
      if (!isHolding) return;

      const heldDuration = Date.now() - holdStartTime;
      const interval = calculateInterval(heldDuration);

      channel.postMessage({ type, delta });

      timeoutId = setTimeout(repeatAction, interval);
    };

    const startHold = () => {
      if (isHolding) return;

      isHolding = true;
      holdStartTime = Date.now();

      channel.postMessage({ type, delta }); // initial fire once
      timeoutId = setTimeout(repeatAction, 300); // delay before repeating to avoid double fire
    };

    const stopHold = () => {
      isHolding = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    if (button) {
      button.addEventListener('mousedown', startHold);
      button.addEventListener('touchstart', startHold);

      button.addEventListener('mouseup', stopHold);
      button.addEventListener('mouseleave', stopHold);
      button.addEventListener('touchend', stopHold);
      button.addEventListener('touchcancel', stopHold);
    }

    // ✅ Tambahkan key shortcut jika diberikan
  if (keyShortcut) {
    window.addEventListener('keydown', (event) => {
      if (
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        !document.activeElement.isContentEditable &&
        event.key.toLowerCase() === keyShortcut &&
        !event.repeat
      ) {
        startHold();
      }
    });

    window.addEventListener('keyup', (event) => {
      if (event.key.toLowerCase() === keyShortcut) {  
        stopHold();
      }
    });
  }
  }

  // === SHOT CLOCK BUTTONS ===
  if (add1ShotBtn && sub1ShotBtn) {
    setupDynamicHoldButton(add1ShotBtn, 'adjust-shot-time', 1);
    setupDynamicHoldButton(sub1ShotBtn, 'adjust-shot-time', -1);
  }

  // === GAME CLOCK BUTTONS ===
  if (add1GameBtn && sub1GameBtn && add30GameBtn && sub30GameBtn) {
    setupDynamicHoldButton(add1GameBtn, 'adjust-game-time', 1);
    setupDynamicHoldButton(sub1GameBtn, 'adjust-game-time', -1);
    setupDynamicHoldButton(add30GameBtn, 'adjust-game-time', 30, '=');
    setupDynamicHoldButton(sub30GameBtn, 'adjust-game-time', -30, '-');
  }


  // === HOME SCORE BUTTONS ===
  if (add1ScoreHomeBtn && add2ScoreHomeBtn && add3ScoreHomeBtn && sub1ScoreHomeBtn && sub2ScoreHomeBtn && sub3ScoreHomeBtn) {
    setupDynamicHoldButton(add1ScoreHomeBtn, 'adjust-home-score', 1, 's');
    setupDynamicHoldButton(add2ScoreHomeBtn, 'adjust-home-score', 2);
    setupDynamicHoldButton(add3ScoreHomeBtn, 'adjust-home-score', 3);
    setupDynamicHoldButton(sub1ScoreHomeBtn, 'adjust-home-score', -1, 'a');
    setupDynamicHoldButton(sub2ScoreHomeBtn, 'adjust-home-score', -2);
    setupDynamicHoldButton(sub3ScoreHomeBtn, 'adjust-home-score', -3);
  }

  // === HOME FOUL BUTTONS ===
  if (add1FoulHomeBtn && sub1FoulHomeBtn) {
    setupDynamicHoldButton(add1FoulHomeBtn, 'adjust-home-foul', 1, 'x');
    setupDynamicHoldButton(sub1FoulHomeBtn, 'adjust-home-foul', -1, 'z');
  }


  // === AWAY SCORE BUTTONS ===
  if (add1ScoreAwayBtn && add2ScoreAwayBtn && add3ScoreAwayBtn && sub1ScoreAwayBtn && sub2ScoreAwayBtn && sub3ScoreAwayBtn) {
    setupDynamicHoldButton(add1ScoreAwayBtn, 'adjust-away-score', 1, 'l');
    setupDynamicHoldButton(add2ScoreAwayBtn, 'adjust-away-score', 2);
    setupDynamicHoldButton(add3ScoreAwayBtn, 'adjust-away-score', 3);
    setupDynamicHoldButton(sub1ScoreAwayBtn, 'adjust-away-score', -1, 'k');
    setupDynamicHoldButton(sub2ScoreAwayBtn, 'adjust-away-score', -2);
    setupDynamicHoldButton(sub3ScoreAwayBtn, 'adjust-away-score', -3);
  }

  // === AWAY FOUL BUTTONS ===
  if (add1FoulAwayBtn && sub1FoulAwayBtn) {
    setupDynamicHoldButton(add1FoulAwayBtn, 'adjust-away-foul', 1, 'm');
    setupDynamicHoldButton(sub1FoulAwayBtn, 'adjust-away-foul', -1, 'n');
  }

  // === Team Name Input ===
  if (teamHomeInput && teamAwayInput) {
    teamHomeInput.addEventListener('input', (event) => {
      const newValue = event.target.value;
      localStorage.setItem('homeName', newValue);
      channel.postMessage({ type: 'update-team-name', team: 'home', name: newValue });
    });

    teamAwayInput.addEventListener('input', (event) => {
      const newValue = event.target.value;
      localStorage.setItem('awayName', newValue);
      channel.postMessage({ type: 'update-team-name', team: 'away', name: newValue });
    });
  }

  // === PERIOD BUTTONS ===
  if (add1PeriodBtn && sub1PeriodBtn) {
    setupDynamicHoldButton(add1PeriodBtn, 'adjust-period', 1);
    setupDynamicHoldButton(sub1PeriodBtn, 'adjust-period', -1);
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      // Hapus semua data dari localStorage
      localStorage.clear();

      channel.postMessage({ type: 'reset'});

      // (Opsional) Reset tampilan antarmuka
      location.reload(); // Me-reload halaman agar semua input kembali ke default
    });
  }


  if (window.location.pathname.endsWith('input.html')) {
    // ===============================
    // Untuk shortcut keyboard (controller)
    // ===============================
    document.addEventListener('keydown', (event) => {
      const key = event.key;
      const activeElement = document.activeElement;
      const activeTag = activeElement.tagName;

      const isTyping = (
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        activeElement.isContentEditable
      );

      if (isTyping) {
        // Kalau pencet Enter saat sedang ngetik, blur input agar kembali ke "page"
        if (key === 'Enter') {
          activeElement.blur();
        }
        return; // hindari hotkey lain saat mengetik
      }

      if (key === ' ') {
        if (currentInitialShot === 12) {
          set12ShotBtn.click();
        } else if (currentInitialShot === 14) {
          set14ShotBtn.click();
        } else {
          set24ShotBtn.click();
        }

        if (!isShotRunning) {
          shotBtn.click();
        }

        event.preventDefault(); // mencegah scroll saat tekan spasi
      } else if (key === '[' || key === '{') {
        gameBtn.click();
      } else if (key === ']' || key === '}') {
        shotBtn.click();
      } else if (key === 'p' || key === 'P') {
        bothBtn.click();
      }
    });
  }

  if (shotBtn) {
    channel.onmessage = (event) => {
      const data = event.data;

      if (data.type === 'shot-clock-zero') {
        if (isShotRunning) {
          shotBtn.click();
        }
      }
    };
  }
});
