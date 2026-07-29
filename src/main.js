// Main Application Entry Point

import './style.css';
import { CalculatorEngine } from './calculator/engine.js';
import { audioSynth } from './audio/synth.js';
import { Calculator3DModel } from './three/calculatorModel.js';
import { SceneManager } from './three/sceneManager.js';
import { HUDController } from './ui/hud.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Math Engine & Audio
  const engine = new CalculatorEngine();

  // 2. Initialize 3D Model & Scene Manager
  const container = document.getElementById('webgl-container');
  const model = new Calculator3DModel();
  const sceneManager = new SceneManager(container, model);

  sceneManager.init();

  // 3. Initialize HUD Controller
  const hud = new HUDController(engine, audioSynth, sceneManager, model);

  // 4. Initial Screen Render
  model.updateDisplay('0', '', 'DEG', false);

  // Global Audio unlock on first user gesture
  const unlockAudio = () => {
    audioSynth.init();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
});
