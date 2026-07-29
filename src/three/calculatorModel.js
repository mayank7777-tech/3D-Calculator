// Procedural 3D Calculator Model with Canvas Textures, Bevelled Keys & Springs

import * as THREE from 'three';

// Key layout definitions (5 columns, 7 rows for rich standard & scientific layout)
export const KEY_LAYOUT = [
  // Row 0: Mode & Memory
  { id: 'deg_rad', label: 'DEG', type: 'scientific', color: 'accent' },
  { id: 'MC', label: 'MC', type: 'memory', color: 'secondary' },
  { id: 'MR', label: 'MR', type: 'memory', color: 'secondary' },
  { id: 'M+', label: 'M+', type: 'memory', color: 'secondary' },
  { id: 'M-', label: 'M-', type: 'memory', color: 'secondary' },

  // Row 1: Scientific Functions
  { id: 'sin', label: 'sin', type: 'scientific', color: 'sci' },
  { id: 'cos', label: 'cos', type: 'scientific', color: 'sci' },
  { id: 'tan', label: 'tan', type: 'scientific', color: 'sci' },
  { id: 'log', label: 'log', type: 'scientific', color: 'sci' },
  { id: 'ln', label: 'ln', type: 'scientific', color: 'sci' },

  // Row 2: Powers, Roots & Constants
  { id: '^', label: 'x^y', type: 'scientific', color: 'sci' },
  { id: 'sqrt', label: '√x', type: 'scientific', color: 'sci' },
  { id: 'fact', label: 'n!', type: 'scientific', color: 'sci' },
  { id: 'pi', label: 'π', type: 'scientific', color: 'sci' },
  { id: 'e', label: 'e', type: 'scientific', color: 'sci' },

  // Row 3: Clear & Operators
  { id: 'AC', label: 'AC', type: 'clear', color: 'danger' },
  { id: 'BACKSPACE', label: '⌫', type: 'clear', color: 'warning' },
  { id: '(', label: '(', type: 'operator', color: 'secondary' },
  { id: ')', label: ')', type: 'operator', color: 'secondary' },
  { id: '/', label: '÷', type: 'operator', color: 'accent' },

  // Row 4: Digits & Multiplication
  { id: '7', label: '7', type: 'digit', color: 'num' },
  { id: '8', label: '8', type: 'digit', color: 'num' },
  { id: '9', label: '9', type: 'digit', color: 'num' },
  { id: '%', label: '%', type: 'operator', color: 'secondary' },
  { id: '*', label: '×', type: 'operator', color: 'accent' },

  // Row 5: Digits & Subtraction
  { id: '4', label: '4', type: 'digit', color: 'num' },
  { id: '5', label: '5', type: 'digit', color: 'num' },
  { id: '6', label: '6', type: 'digit', color: 'num' },
  { id: '±', label: '±', type: 'operator', color: 'secondary' },
  { id: '-', label: '−', type: 'operator', color: 'accent' },

  // Row 6: Digits, Equals & Addition
  { id: '1', label: '1', type: 'digit', color: 'num' },
  { id: '2', label: '2', type: 'digit', color: 'num' },
  { id: '3', label: '3', type: 'digit', color: 'num' },
  { id: '0', label: '0', type: 'digit', color: 'num' },
  { id: '.', label: '.', type: 'digit', color: 'num' },
  { id: '=', label: '=', type: 'equals', color: 'primary', widthSpan: 2 },
  { id: '+', label: '+', type: 'operator', color: 'accent' }
];

export class Calculator3DModel {
  constructor() {
    this.group = new THREE.Group();
    this.buttons = new Map(); // id -> button mesh info
    this.materials = {};
    this.screenCanvas = null;
    this.screenContext = null;
    this.screenTexture = null;
    this.currentTheme = 'cyberpunk';
  }

  buildModel() {
    // Main Body Dimensions
    const width = 6.8;
    const height = 0.9;
    const depth = 9.8;

    // 1. Base Chassis
    const chassisShape = new THREE.Shape();
    const radius = 0.4;
    const w = width / 2;
    const d = depth / 2;

    chassisShape.moveTo(-w + radius, -d);
    chassisShape.lineTo(w - radius, -d);
    chassisShape.quadraticCurveTo(w, -d, w, -d + radius);
    chassisShape.lineTo(w, d - radius);
    chassisShape.quadraticCurveTo(w, d, w - radius, d);
    chassisShape.lineTo(-w + radius, d);
    chassisShape.quadraticCurveTo(-w, d, -w, d - radius);
    chassisShape.lineTo(-w, -d + radius);
    chassisShape.quadraticCurveTo(-w, -d, -w + radius, -d);

    const extrudeSettings = {
      steps: 2,
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.12,
      bevelSegments: 4
    };

    const chassisGeo = new THREE.ExtrudeGeometry(chassisShape, extrudeSettings);
    chassisGeo.rotateX(-Math.PI / 2);
    chassisGeo.center();

    this.materials.chassis = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      metalness: 0.8,
      roughness: 0.25,
      envMapIntensity: 1.2
    });

    const chassisMesh = new THREE.Mesh(chassisGeo, this.materials.chassis);
    chassisMesh.castShadow = true;
    chassisMesh.receiveShadow = true;
    chassisMesh.position.y = 0;
    this.group.add(chassisMesh);

    // 2. Solar Panel Strip (Futuristic Accent)
    const solarGeo = new THREE.BoxGeometry(2.4, 0.05, 0.6);
    this.materials.solar = new THREE.MeshPhysicalMaterial({
      color: 0x052211,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    const solarMesh = new THREE.Mesh(solarGeo, this.materials.solar);
    solarMesh.position.set(1.8, height / 2 + 0.08, 4.0);
    this.group.add(solarMesh);

    // Brand Badge
    const brandGeo = new THREE.PlaneGeometry(1.6, 0.4);
    const brandCanvas = document.createElement('canvas');
    brandCanvas.width = 256;
    brandCanvas.height = 64;
    const bCtx = brandCanvas.getContext('2d');
    bCtx.fillStyle = '#0a0d14';
    bCtx.fillRect(0, 0, 256, 64);
    bCtx.font = 'bold 24px sans-serif';
    bCtx.fillStyle = '#00f0ff';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';
    bCtx.fillText('NEXUS 3D', 128, 32);

    const brandTexture = new THREE.CanvasTexture(brandCanvas);
    const brandMat = new THREE.MeshBasicMaterial({ map: brandTexture, transparent: true });
    const brandMesh = new THREE.Mesh(brandGeo, brandMat);
    brandMesh.rotation.x = -Math.PI / 2;
    brandMesh.position.set(-1.8, height / 2 + 0.08, 4.0);
    this.group.add(brandMesh);

    // 3. Screen Setup
    this.createScreen(width, height);

    // 4. Buttons Grid Setup
    this.createButtons(width, height);

    return this.group;
  }

  createScreen(bodyWidth, bodyHeight) {
    const screenW = 6.0;
    const screenH = 2.0;

    // Screen Housing Frame
    const frameGeo = new THREE.BoxGeometry(screenW + 0.3, 0.1, screenH + 0.3);
    this.materials.screenFrame = new THREE.MeshStandardMaterial({
      color: 0x0d0f14,
      metalness: 0.5,
      roughness: 0.3
    });
    const frameMesh = new THREE.Mesh(frameGeo, this.materials.screenFrame);
    frameMesh.position.set(0, bodyHeight / 2 + 0.05, 2.5);
    this.group.add(frameMesh);

    // Screen Canvas
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 1024;
    this.screenCanvas.height = 340;
    this.screenContext = this.screenCanvas.getContext('2d');

    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTexture.minFilter = THREE.LinearFilter;
    this.screenTexture.magFilter = THREE.LinearFilter;

    const screenGeo = new THREE.PlaneGeometry(screenW, screenH);
    this.materials.screenDisplay = new THREE.MeshBasicMaterial({
      map: this.screenTexture,
      transparent: false
    });

    const screenMesh = new THREE.Mesh(screenGeo, this.materials.screenDisplay);
    screenMesh.rotation.x = -Math.PI / 2;
    screenMesh.position.set(0, bodyHeight / 2 + 0.11, 2.5);
    this.group.add(screenMesh);

    // Initial Screen Draw
    this.updateDisplay('0', '', 'DEG', false);
  }

  updateDisplay(mainResult, expressionStr, angleMode = 'DEG', hasMemory = false) {
    if (!this.screenContext) return;
    const ctx = this.screenContext;
    const w = this.screenCanvas.width;
    const h = this.screenCanvas.height;

    // Clear background (Dark OLED screen effect)
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, w, h);

    // Subtle OLED Grid Lines
    ctx.strokeStyle = '#0d1527';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Top Status Bar Indicators
    ctx.font = '600 28px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'left';
    ctx.fillText(angleMode, 30, 48);

    if (hasMemory) {
      ctx.fillStyle = '#ff007f';
      ctx.fillText('M', 110, 48);
    }

    ctx.fillStyle = '#708090';
    ctx.textAlign = 'right';
    ctx.fillText('3D NEXUS OS v3.6', w - 30, 48);

    // Top Expression Text (Smaller font)
    ctx.font = '400 38px "JetBrains Mono", monospace';
    ctx.fillStyle = '#7a92b0';
    ctx.textAlign = 'right';
    const exprText = expressionStr.length > 32 ? '...' + expressionStr.slice(-30) : expressionStr;
    ctx.fillText(exprText, w - 30, 110);

    // Main Output Result (Large LED Glow)
    ctx.font = 'bold 88px "JetBrains Mono", monospace';

    if (mainResult === 'Error') {
      ctx.fillStyle = '#ff2a6d';
      ctx.shadowColor = '#ff2a6d';
      ctx.shadowBlur = 15;
      ctx.fillText('ERROR', w - 30, 240);
    } else {
      ctx.fillStyle = '#00ffe1';
      ctx.shadowColor = '#00ffe1';
      ctx.shadowBlur = 18;

      let resultDisp = mainResult || '0';
      if (resultDisp.length > 14) {
        ctx.font = 'bold 64px "JetBrains Mono", monospace';
      }
      ctx.fillText(resultDisp, w - 30, 240);
    }

    ctx.shadowBlur = 0; // reset
    this.screenTexture.needsUpdate = true;
  }

  createButtons(bodyWidth, bodyHeight) {
    const cols = 5;
    const startZ = 0.8;
    const rowGap = 0.95;
    const colGap = 1.15;
    const startX = -((cols - 1) * colGap) / 2;

    const baseBtnW = 0.98;
    const baseBtnH = 0.45;
    const baseBtnD = 0.78;

    let colIndex = 0;
    let rowIndex = 0;

    KEY_LAYOUT.forEach((keyData) => {
      const span = keyData.widthSpan || 1;
      const btnW = baseBtnW * span + (span - 1) * (colGap - baseBtnW);

      // Create Key Geometry with chamfered bevels
      const btnShape = new THREE.Shape();
      const r = 0.12;
      const bw = btnW / 2;
      const bd = baseBtnD / 2;

      btnShape.moveTo(-bw + r, -bd);
      btnShape.lineTo(bw - r, -bd);
      btnShape.quadraticCurveTo(bw, -bd, bw, -bd + r);
      btnShape.lineTo(bw, bd - r);
      btnShape.quadraticCurveTo(bw, bd, bw - r, bd);
      btnShape.lineTo(-bw + r, bd);
      btnShape.quadraticCurveTo(-bw, bd, -bw, bd - r);
      btnShape.lineTo(-bw, -bd + r);
      btnShape.quadraticCurveTo(-bw, -bd, -bw + r, -bd);

      const extrudeSettings = {
        depth: baseBtnH,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.06,
        bevelSegments: 3
      };

      const keyGeo = new THREE.ExtrudeGeometry(btnShape, extrudeSettings);
      keyGeo.rotateX(-Math.PI / 2);
      keyGeo.center();

      // Create Label Texture for Button
      const labelTexture = this.createButtonLabelTexture(keyData.label, keyData.color);

      const topMaterial = new THREE.MeshBasicMaterial({ map: labelTexture });
      const sideMaterial = new THREE.MeshStandardMaterial({
        color: this.getButtonBaseColor(keyData.color),
        metalness: 0.3,
        roughness: 0.4
      });

      // Material Array: Top face gets label texture, sides get solid standard material
      const materials = [sideMaterial, topMaterial];

      const keyMesh = new THREE.Mesh(keyGeo, materials);
      keyMesh.castShadow = true;
      keyMesh.receiveShadow = true;

      const posX = startX + (colIndex + (span - 1) / 2) * colGap;
      const posZ = startZ - rowIndex * rowGap;
      const posY = bodyHeight / 2 + baseBtnH / 2 + 0.08;

      keyMesh.position.set(posX, posY, posZ);

      // Custom User Data for Raycasting & Spring Physics
      keyMesh.userData = {
        id: keyData.id,
        label: keyData.label,
        type: keyData.type,
        colorType: keyData.color,
        originalY: posY,
        pressedY: posY - 0.22,
        currentY: posY,
        targetY: posY,
        velocity: 0,
        sideMaterial: sideMaterial,
        topMaterial: topMaterial
      };

      this.group.add(keyMesh);
      this.buttons.set(keyData.id, keyMesh);

      colIndex += span;
      if (colIndex >= cols) {
        colIndex = 0;
        rowIndex++;
      }
    });
  }

  createButtonLabelTexture(label, colorType) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Background base
    ctx.fillStyle = this.getButtonCanvasBg(colorType);
    ctx.fillRect(0, 0, 256, 256);

    // Inner subtle border
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 236, 236);

    // Text Label
    ctx.font = label.length > 2 ? 'bold 76px "JetBrains Mono", sans-serif' : 'bold 96px "JetBrains Mono", sans-serif';
    ctx.fillStyle = this.getButtonTextColor(colorType);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text Glow
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.fillText(label, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  getButtonBaseColor(colorType) {
    switch (colorType) {
      case 'primary': return 0x00f0ff;
      case 'accent': return 0xff007f;
      case 'danger': return 0xff2a6d;
      case 'warning': return 0xffa500;
      case 'sci': return 0x1f293d;
      case 'secondary': return 0x252a36;
      case 'num': default: return 0x181c26;
    }
  }

  getButtonCanvasBg(colorType) {
    switch (colorType) {
      case 'primary': return '#00bcd4';
      case 'accent': return '#d81b60';
      case 'danger': return '#e53935';
      case 'warning': return '#fb8c00';
      case 'sci': return '#1e2838';
      case 'secondary': return '#262d3d';
      case 'num': default: return '#161a24';
    }
  }

  getButtonTextColor(colorType) {
    switch (colorType) {
      case 'primary': case 'accent': case 'danger': case 'warning':
        return '#ffffff';
      case 'sci':
        return '#00f0ff';
      case 'secondary':
        return '#e0e6ed';
      case 'num': default:
        return '#f0f4f8';
    }
  }

  pressButton(id) {
    const btn = this.buttons.get(id);
    if (!btn) return;

    btn.userData.targetY = btn.userData.pressedY;
    btn.userData.sideMaterial.emissive = new THREE.Color(0x00f0ff);
    btn.userData.sideMaterial.emissiveIntensity = 0.8;

    setTimeout(() => {
      btn.userData.targetY = btn.userData.originalY;
      setTimeout(() => {
        btn.userData.sideMaterial.emissiveIntensity = 0;
      }, 120);
    }, 90);
  }

  updatePhysics(deltaTime) {
    // Spring physics updates for key depressions
    this.buttons.forEach((btn) => {
      const data = btn.userData;
      const dy = data.targetY - data.currentY;

      // Spring damper equation
      const springStiffness = 300;
      const damping = 22;

      const force = dy * springStiffness;
      data.velocity += force * deltaTime;
      data.velocity -= data.velocity * damping * deltaTime;

      data.currentY += data.velocity * deltaTime;
      btn.position.y = data.currentY;
    });
  }

  setTheme(themeName) {
    this.currentTheme = themeName;
    let chassisColor, chassisMetal, chassisRough;

    switch (themeName) {
      case 'cyberpunk':
        chassisColor = 0x12131a;
        chassisMetal = 0.8;
        chassisRough = 0.2;
        break;

      case 'stealth':
        chassisColor = 0x08090b;
        chassisMetal = 0.95;
        chassisRough = 0.15;
        break;

      case 'synthwave':
        chassisColor = 0x240038;
        chassisMetal = 0.6;
        chassisRough = 0.3;
        break;

      case 'appleglass':
        chassisColor = 0xe2e8f0;
        chassisMetal = 0.1;
        chassisRough = 0.1;
        break;

      default:
        chassisColor = 0x181a20;
        chassisMetal = 0.8;
        chassisRough = 0.25;
        break;
    }

    if (this.materials.chassis) {
      this.materials.chassis.color.setHex(chassisColor);
      this.materials.chassis.metalness = chassisMetal;
      this.materials.chassis.roughness = chassisRough;
    }
  }
}
