// Three.js Scene Lifecycle, Studio Lighting, OrbitControls & Raycasting Manager

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
  constructor(containerElement, calculatorModel) {
    this.container = containerElement;
    this.calculatorModel = calculatorModel;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.clock = new THREE.Clock();
    this.lights = {};
    this.particles = null;

    this.hoveredButton = null;
    this.onButtonClickCallback = null;
    this.isIdleFloating = true;

    this.cameraTargetPos = new THREE.Vector3(0, 10, 10);
    this.cameraTargetLook = new THREE.Vector3(0, 0, 0);
  }

  init() {
    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c14);
    this.scene.fog = new THREE.FogExp2(0x0a0c14, 0.025);

    // 2. Camera Setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 10, 9);

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below floor
    this.controls.minDistance = 4;
    this.controls.maxDistance = 22;

    // 5. Studio Lighting
    this.setupLighting();

    // 6. Reflective Studio Floor Plane
    this.setupFloor();

    // 7. Background Floating Particles
    this.setupParticles();

    // 8. Add Calculator Model
    const modelGroup = this.calculatorModel.buildModel();
    this.scene.add(modelGroup);

    // 9. Event Listeners
    this.addEventListeners();

    // 10. Start Animation Loop
    this.animate();
  }

  setupLighting() {
    // Ambient Light
    this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(this.lights.ambient);

    // Key Light (Directional with Soft Shadows)
    this.lights.keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    this.lights.keyLight.position.set(6, 12, 8);
    this.lights.keyLight.castShadow = true;
    this.lights.keyLight.shadow.mapSize.width = 2048;
    this.lights.keyLight.shadow.mapSize.height = 2048;
    this.lights.keyLight.shadow.camera.near = 0.5;
    this.lights.keyLight.shadow.camera.far = 30;
    this.lights.keyLight.shadow.camera.left = -8;
    this.lights.keyLight.shadow.camera.right = 8;
    this.lights.keyLight.shadow.camera.top = 8;
    this.lights.keyLight.shadow.camera.bottom = -8;
    this.lights.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.lights.keyLight);

    // Cyan Rim Light (Cyberpunk Studio Feel)
    this.lights.rimLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
    this.lights.rimLight.position.set(-8, 6, -6);
    this.scene.add(this.lights.rimLight);

    // Pink Under Glow PointLight
    this.lights.glowLight = new THREE.PointLight(0xff007f, 3.0, 12);
    this.lights.glowLight.position.set(0, -0.5, 0);
    this.scene.add(this.lights.glowLight);
  }

  setupFloor() {
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x07080e,
      roughness: 0.2,
      metalness: 0.8
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.6;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // Subtle Grid Helper
    const grid = new THREE.GridHelper(50, 50, 0x00f0ff, 0x1a233a);
    grid.position.y = -0.59;
    grid.material.opacity = 0.25;
    grid.material.transparent = true;
    this.scene.add(grid);
  }

  setupParticles() {
    const particleCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 30;
      positions[i + 1] = Math.random() * 15;
      positions[i + 2] = (Math.random() - 0.5) * 30;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  addEventListeners() {
    window.addEventListener('resize', this.onResize.bind(this));

    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', this.onPointerMove.bind(this));
    dom.addEventListener('pointerdown', this.onPointerDown.bind(this));
  }

  onPointerMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast check for hover effect on 3D buttons
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.calculatorModel.group.children, true);

    let foundBtn = null;
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      if (obj.userData && obj.userData.id) {
        foundBtn = obj;
      }
    }

    if (foundBtn !== this.hoveredButton) {
      if (this.hoveredButton && this.hoveredButton.userData.sideMaterial) {
        this.hoveredButton.userData.sideMaterial.emissiveIntensity = 0;
      }
      this.hoveredButton = foundBtn;
      if (this.hoveredButton && this.hoveredButton.userData.sideMaterial) {
        this.hoveredButton.userData.sideMaterial.emissive = new THREE.Color(0x00ffe1);
        this.hoveredButton.userData.sideMaterial.emissiveIntensity = 0.4;
      }
      this.renderer.domElement.style.cursor = foundBtn ? 'pointer' : 'default';
    }
  }

  onPointerDown(event) {
    if (event.button !== 0) return; // Left click only

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.calculatorModel.group.children, true);

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj.userData && obj.userData.id) {
        // Trigger 3D Button Animation
        this.calculatorModel.pressButton(obj.userData.id);

        if (this.onButtonClickCallback) {
          this.onButtonClickCallback(obj.userData.id, obj.userData.type);
        }
      }
    }
  }

  setCameraPreset(preset) {
    this.isIdleFloating = false;

    switch (preset) {
      case 'iso':
        this.cameraTargetPos.set(0, 10, 9);
        this.cameraTargetLook.set(0, 0, 0);
        break;
      case 'top':
        this.cameraTargetPos.set(0, 13, 0.1);
        this.cameraTargetLook.set(0, 0, 0);
        break;
      case 'front':
        this.cameraTargetPos.set(0, 4, 11);
        this.cameraTargetLook.set(0, 1, 0);
        break;
      case 'close':
        this.cameraTargetPos.set(0, 6, 5);
        this.cameraTargetLook.set(0, 1.2, 0.5);
        break;
      default:
        break;
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Smooth camera target lerp
    this.camera.position.lerp(this.cameraTargetPos, delta * 4);
    this.controls.target.lerp(this.cameraTargetLook, delta * 4);

    // Gentle floating idle animation if enabled
    if (this.isIdleFloating && this.calculatorModel.group) {
      this.calculatorModel.group.position.y = Math.sin(elapsedTime * 1.5) * 0.12;
      this.calculatorModel.group.rotation.y = Math.sin(elapsedTime * 0.8) * 0.04;
    } else {
      this.calculatorModel.group.position.y = 0;
      this.calculatorModel.group.rotation.y = 0;
    }

    // Animate background particles
    if (this.particles) {
      this.particles.rotation.y = elapsedTime * 0.03;
    }

    // Update spring physics for key depressions
    this.calculatorModel.updatePhysics(delta);

    // Controls update
    this.controls.update();

    // Render frame
    this.renderer.render(this.scene, this.camera);
  }
}
