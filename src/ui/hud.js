// Interactive Heads-Up Display (HUD), Keyboard Synchronization & UI Controller

import confetti from 'canvas-confetti';

export class HUDController {
  constructor(engine, audioSynth, sceneManager, calculatorModel) {
    this.engine = engine;
    this.synth = audioSynth;
    this.sceneManager = sceneManager;
    this.model = calculatorModel;

    this.isAudioOn = true;
    this.currentTheme = 'cyberpunk';
    this.historyOpen = false;

    this.bindDOM();
  }

  bindDOM() {
    // Top Bar Buttons
    this.themeSelect = document.getElementById('theme-select');
    this.audioToggle = document.getElementById('audio-toggle');
    this.historyToggle = document.getElementById('history-toggle');
    this.historyDrawer = document.getElementById('history-drawer');
    this.historyList = document.getElementById('history-list');
    this.clearHistoryBtn = document.getElementById('clear-history-btn');

    // Camera Preset Buttons
    this.camPresetBtns = document.querySelectorAll('.cam-btn');

    // On-screen HUD 2D Keypad overlay (for touch devices or quick mouse entry)
    this.screenKeypad = document.getElementById('hud-keypad');

    // Key event bindings
    this.initEventListeners();
  }

  initEventListeners() {
    // 1. Theme Selection
    if (this.themeSelect) {
      this.themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        this.model.setTheme(theme);
        this.synth.playKeyClick('scientific');
      });
    }

    // 2. Audio Mute / Unmute
    if (this.audioToggle) {
      this.audioToggle.addEventListener('click', () => {
        this.isAudioOn = this.synth.toggleSound();
        this.audioToggle.classList.toggle('active', this.isAudioOn);
        this.audioToggle.querySelector('.icon').textContent = this.isAudioOn ? '🔊' : '🔇';
      });
    }

    // 3. History Drawer Toggle
    if (this.historyToggle && this.historyDrawer) {
      this.historyToggle.addEventListener('click', () => {
        this.historyOpen = !this.historyOpen;
        this.historyDrawer.classList.toggle('open', this.historyOpen);
        this.renderHistory();
      });
    }

    if (this.clearHistoryBtn) {
      this.clearHistoryBtn.addEventListener('click', () => {
        this.engine.history = [];
        this.renderHistory();
        this.synth.playKeyClick('clear');
      });
    }

    // 4. Camera View Presets
    if (this.camPresetBtns) {
      this.camPresetBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          this.camPresetBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const preset = btn.getAttribute('data-preset');
          this.sceneManager.setCameraPreset(preset);
          this.synth.playKeyClick('scientific');
        });
      });
    }

    // 5. 3D Model Raycast Click Callback from SceneManager
    this.sceneManager.onButtonClickCallback = (keyId, keyType) => {
      this.handleKeyAction(keyId, keyType);
    };

    // 6. Keyboard Listener
    window.addEventListener('keydown', this.handlePhysicalKeyboard.bind(this));

    // 7. Render 2D HUD Keypad Buttons
    this.renderHUDKeypad();
  }

  renderHUDKeypad() {
    if (!this.screenKeypad) return;
    this.screenKeypad.innerHTML = '';

    const quickKeys = [
      { id: 'AC', label: 'AC', class: 'btn-danger' },
      { id: 'BACKSPACE', label: '⌫', class: 'btn-warning' },
      { id: 'deg_rad', label: 'DEG', class: 'btn-sci' },
      { id: '/', label: '÷', class: 'btn-op' },

      { id: '7', label: '7', class: 'btn-num' },
      { id: '8', label: '8', class: 'btn-num' },
      { id: '9', label: '9', class: 'btn-num' },
      { id: '*', label: '×', class: 'btn-op' },

      { id: '4', label: '4', class: 'btn-num' },
      { id: '5', label: '5', class: 'btn-num' },
      { id: '6', label: '6', class: 'btn-num' },
      { id: '-', label: '−', class: 'btn-op' },

      { id: '1', label: '1', class: 'btn-num' },
      { id: '2', label: '2', class: 'btn-num' },
      { id: '3', label: '3', class: 'btn-num' },
      { id: '+', label: '+', class: 'btn-op' },

      { id: '0', label: '0', class: 'btn-num' },
      { id: '.', label: '.', class: 'btn-num' },
      { id: '±', label: '±', class: 'btn-num' },
      { id: '=', label: '=', class: 'btn-equals' }
    ];

    quickKeys.forEach((k) => {
      const btn = document.createElement('button');
      btn.className = `hud-btn ${k.class}`;
      btn.textContent = k.label;
      btn.setAttribute('data-id', k.id);
      btn.addEventListener('click', () => {
        // Synchronize 3D button animation
        this.model.pressButton(k.id);
        this.handleKeyAction(k.id);
      });
      this.screenKeypad.appendChild(btn);
    });
  }

  handlePhysicalKeyboard(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

    let keyId = null;

    if (event.key >= '0' && event.key <= '9') keyId = event.key;
    else if (event.key === '.') keyId = '.';
    else if (event.key === '+') keyId = '+';
    else if (event.key === '-') keyId = '-';
    else if (event.key === '*') keyId = '*';
    else if (event.key === '/') keyId = '/';
    else if (event.key === '%') keyId = '%';
    else if (event.key === '^') keyId = '^';
    else if (event.key === '(') keyId = '(';
    else if (event.key === ')') keyId = ')';
    else if (event.key === 'Enter' || event.key === '=') keyId = '=';
    else if (event.key === 'Backspace') keyId = 'BACKSPACE';
    else if (event.key === 'Escape') keyId = 'AC';
    else if (event.key.toLowerCase() === 's') keyId = 'sin';
    else if (event.key.toLowerCase() === 'c') keyId = 'cos';
    else if (event.key.toLowerCase() === 't') keyId = 'tan';

    if (keyId) {
      event.preventDefault();
      // Press 3D button
      this.model.pressButton(keyId);
      // Execute engine logic
      this.handleKeyAction(keyId);
    }
  }

  handleKeyAction(keyId, keyTypeHint) {
    // 1. Play Audio Feedback
    if (keyId === '=') this.synth.playKeyClick('equals');
    else if (keyId === 'AC' || keyId === 'BACKSPACE') this.synth.playKeyClick('clear');
    else if (['+', '-', '*', '/', '%', '^'].includes(keyId)) this.synth.playKeyClick('operator');
    else if (['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'fact', 'deg_rad'].includes(keyId)) this.synth.playKeyClick('scientific');
    else this.synth.playKeyClick('digit');

    // 2. Execute calculation engine step
    const resultState = this.engine.handleInput(keyId);

    // 3. Special cases & triggers
    if (resultState.type === 'mode_change') {
      const degBtn = document.querySelector('[data-id="deg_rad"]');
      if (degBtn) degBtn.textContent = resultState.isDegree ? 'DEG' : 'RAD';
      this.showNotification(resultState.isDegree ? 'Mode: Degrees' : 'Mode: Radians');
    } else if (resultState.type === 'memory') {
      this.showNotification(resultState.msg);
    } else if (resultState.type === 'evaluated') {
      if (resultState.error) {
        this.synth.playError();
      } else {
        // Confetti trigger for special answers (e.g. 42, 69, 777, or pi)
        const num = Math.abs(resultState.numericResult);
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
        } catch (e) {
          // Fallback if confetti package is unavailable
        }
      }
    }

    // 4. Update 3D OLED Display & 2D HUD Display
    const modeLabel = this.engine.isDegree ? 'DEG' : 'RAD';
    const hasMemory = this.engine.memory !== 0;

    this.model.updateDisplay(
      this.engine.currentInput,
      this.engine.getDisplayExpression(),
      modeLabel,
      hasMemory
    );

    this.updateHUDDisplay();
    if (this.historyOpen) this.renderHistory();
  }

  updateHUDDisplay() {
    const mainDisp = document.getElementById('hud-main-display');
    const subDisp = document.getElementById('hud-sub-display');
    const badgeDeg = document.getElementById('hud-badge-deg');
    const badgeMem = document.getElementById('hud-badge-mem');

    if (mainDisp) mainDisp.textContent = this.engine.currentInput || '0';
    if (subDisp) subDisp.textContent = this.engine.getDisplayExpression();
    if (badgeDeg) badgeDeg.textContent = this.engine.isDegree ? 'DEG' : 'RAD';
    if (badgeMem) badgeMem.style.display = this.engine.memory !== 0 ? 'inline-block' : 'none';
  }

  renderHistory() {
    if (!this.historyList) return;
    this.historyList.innerHTML = '';

    if (this.engine.history.length === 0) {
      this.historyList.innerHTML = '<div class="empty-history">No calculation history yet</div>';
      return;
    }

    this.engine.history.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'history-item';
      el.innerHTML = `
        <div class="hist-expr">${item.expression} =</div>
        <div class="hist-res">${item.result}</div>
      `;
      el.addEventListener('click', () => {
        this.engine.expression = item.result;
        this.engine.currentInput = item.result;
        this.handleKeyAction('');
      });
      this.historyList.appendChild(el);
    });
  }

  showNotification(msg) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }
}
