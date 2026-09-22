export const DEFAULT_3D_ROBLOX_OBBY_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>S-Obby 3D: ネオンパルクール</title>
<!-- Three.js 3D Engine -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
  body, html { width: 100%; height: 100%; overflow: hidden; background: #050510; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  #canvas3d { width: 100vw; height: 100vh; display: block; }
  
  /* Top HUD */
  #hud {
    position: absolute; top: 12px; left: 16px; right: 16px;
    display: flex; justify-content: space-between; align-items: center;
    pointer-events: none; z-index: 10;
  }
  .hud-badge {
    background: rgba(15, 15, 25, 0.75); border: 1px solid rgba(139, 92, 246, 0.4);
    padding: 8px 16px; border-radius: 9999px; color: #fff; font-size: 13px; font-weight: 700;
    backdrop-filter: blur(8px); display: flex; align-items: center; gap: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  }
  .hud-badge span.accent { color: #facc15; }

  /* Center Start / Clear overlay */
  #center-msg {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: rgba(10, 10, 20, 0.88); border: 2px solid #8b5cf6;
    padding: 24px 28px; border-radius: 20px; text-align: center; color: #fff;
    backdrop-filter: blur(12px); box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);
    pointer-events: auto; z-index: 30; width: 90%; max-width: 440px;
  }
  #center-msg h2 { font-size: 22px; margin-bottom: 8px; color: #a78bfa; }
  #center-msg p { font-size: 12px; color: #cbd5e1; margin-bottom: 16px; line-height: 1.6; }
  #center-msg button {
    background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; border: none;
    padding: 10px 30px; border-radius: 9999px; font-weight: 700; font-size: 14px; cursor: pointer;
  }

  /* Roblox-Style Mobile Virtual Joystick & Jump Button */
  #mobile-controls {
    position: absolute; bottom: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 20;
  }
  
  /* Left Virtual Joystick (Roblox Style) */
  #joystick-zone {
    position: absolute; bottom: 30px; left: 25px; width: 130px; height: 130px;
    pointer-events: auto; touch-action: none;
  }
  #joystick-base {
    width: 130px; height: 130px; border-radius: 50%;
    background: rgba(255, 255, 255, 0.1); border: 2px solid rgba(255, 255, 255, 0.3);
    position: relative; backdrop-filter: blur(4px);
    box-shadow: 0 0 20px rgba(0,0,0,0.4);
  }
  #joystick-stick {
    width: 54px; height: 54px; border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, rgba(167, 139, 250, 0.95), rgba(124, 58, 237, 0.8));
    border: 2px solid #c4b5fd;
    position: absolute; top: 38px; left: 38px; pointer-events: none;
    box-shadow: 0 4px 15px rgba(124, 58, 237, 0.6);
  }

  /* Right Jump Button (Roblox Style) */
  #jump-button {
    position: absolute; bottom: 40px; right: 30px; width: 80px; height: 80px;
    border-radius: 50%; pointer-events: auto; touch-action: none; cursor: pointer;
    background: radial-gradient(circle at 35% 35%, rgba(139, 92, 246, 0.85), rgba(79, 70, 229, 0.9));
    border: 3px solid rgba(196, 181, 253, 0.8);
    box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: #fff; font-weight: 800; font-size: 11px; letter-spacing: 1px;
    backdrop-filter: blur(6px); transition: transform 0.1s;
  }
  #jump-button:active { transform: scale(0.92); }
  #jump-button svg { width: 24px; height: 24px; fill: #fff; margin-bottom: 2px; }

  /* Right Screen Camera Orbit Swipe Zone */
  #camera-touch-zone {
    position: absolute; top: 0; right: 0; width: 55vw; height: 100vh;
    pointer-events: auto; touch-action: none; z-index: 15;
  }
</style>
</head>
<body>

<canvas id="canvas3d"></canvas>

<!-- HUD -->
<div id="hud">
  <div class="hud-badge">
    <span>💎 コイン:</span>
    <span id="coin-counter" class="accent">0 / 6</span>
  </div>
  <div class="hud-badge">
    <span>🏁 ステージ:</span>
    <span class="accent">ネオンアスレチック</span>
  </div>
</div>

<!-- Center Dialog -->
<div id="center-msg">
  <h2 id="msg-title">S-Obby 3D パルクール</h2>
  <p id="msg-desc">
    浮遊ブロックをジャンプで渡り、コインを集めてゴールを目指そう！<br>
    <strong>【モバイル】</strong>: 左下ジョイスティック移動、右下JUMPジャンプ、右側スワイプで視点回転（Robloxと同じ操作）<br>
    <strong>【PC】</strong>: [W][A][S][D] 移動、[SPACE] ジャンプ、マウスドラッグ視点回転
  </p>
  <button id="start-btn">スタート！</button>
</div>

<!-- Roblox Mobile Controls Overlay -->
<div id="mobile-controls">
  <div id="joystick-zone">
    <div id="joystick-base">
      <div id="joystick-stick"></div>
    </div>
  </div>

  <button id="jump-button" aria-label="ジャンプ">
    <svg viewBox="0 0 24 24"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg>
    JUMP
  </button>
</div>

<!-- Camera Swipe Zone -->
<div id="camera-touch-zone"></div>

<script>
// --- Audio Synthesizer ---
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function playTone(freq, type, duration, slideFreq = null) {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideFreq) osc.frequency.exponentialRampToValueAtTime(slideFreq, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}

const sound = {
  jump: () => playTone(300, 'sine', 0.25, 650),
  coin: () => { playTone(600, 'sine', 0.1, 900); setTimeout(() => playTone(900, 'sine', 0.18, 1400), 80); },
  fall: () => playTone(260, 'sawtooth', 0.35, 60),
  win: () => { [400, 520, 660, 880].forEach((f, i) => setTimeout(() => playTone(f, 'triangle', 0.25), i * 120)); }
};

// --- Three.js 3D Scene ---
const canvas = document.getElementById('canvas3d');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060614);
scene.fog = new THREE.FogExp2(0x060614, 0.016);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xa78bfa, 1.2);
dirLight.position.set(30, 60, 30);
scene.add(dirLight);

// Stars background
const starsGeo = new THREE.BufferGeometry();
const starPos = [];
for (let i = 0; i < 250; i++) starPos.push((Math.random()-0.5)*400, Math.random()*150-20, (Math.random()-0.5)*400);
starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0x93c5fd, size: 1.5, transparent: true, opacity: 0.7 })));

// Platforms & Obstacles
const platforms = [];
const coins = [];
const platformColors = [0x6366f1, 0xec4899, 0x10b981, 0xf59e0b, 0x06b6d4];
function createPlatform(x, y, z, w, h, d, cIdx = 0, moving = false) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color: platformColors[cIdx % platformColors.length], roughness: 0.3 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  const p = { mesh, x, y, z, w, h, d, moving, originX: x, speed: (Math.random()*0.04 + 0.02) };
  platforms.push(p);
  return p;
}
function createCoin(x, y, z) {
  const geo = new THREE.CylinderGeometry(0.8, 0.8, 0.25, 16);
  const mat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y + 1.6, z);
  scene.add(mesh);
  coins.push({ mesh, collected: false });
}

createPlatform(0, 0, 0, 10, 2, 10, 0); createCoin(0, 1.5, 0);
createPlatform(0, 1, -12, 6, 1.5, 6, 1); createCoin(0, 2, -12);
createPlatform(6, 3, -22, 5, 1.5, 5, 2, true); createCoin(6, 4.5, -22);
createPlatform(0, 5, -34, 4, 1.5, 4, 3); createCoin(0, 6.5, -34);
createPlatform(-7, 7, -46, 5, 1.5, 5, 4, true); createCoin(-7, 8.5, -46);
createPlatform(0, 9, -60, 12, 2, 12, 0); createCoin(0, 10.5, -60);

const goalPortal = new THREE.Mesh(new THREE.TorusGeometry(3, 0.4, 16, 50), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 }));
goalPortal.position.set(0, 12.5, -60);
scene.add(goalPortal);

// Player Roblox-style Avatar
const playerGroup = new THREE.Group();
const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: 0xfcd34d }));
head.position.y = 2.2; playerGroup.add(head);
const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.0), new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }));
body.position.y = 0.9; playerGroup.add(body);
const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
leftArm.position.set(-1.1, 0.9, 0); playerGroup.add(leftArm);
const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
rightArm.position.set(1.1, 0.9, 0); playerGroup.add(rightArm);
const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
leftLeg.position.set(-0.45, -0.6, 0); playerGroup.add(leftLeg);
const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
rightLeg.position.set(0.45, -0.6, 0); playerGroup.add(rightLeg);
scene.add(playerGroup);

const player = { pos: new THREE.Vector3(0, 3, 0), vel: new THREE.Vector3(0, 0, 0), speed: 0.32, jumpPower: 0.42, gravity: -0.018, onGround: false, rotationY: 0 };
playerGroup.position.copy(player.pos);

let camAngleH = 0, camAngleV = 0.35; const camDist = 12;
const input = { moveX: 0, moveZ: 0 };
const keys = {};

window.addEventListener('keydown', (e) => {
  initAudio(); keys[e.code] = true;
  if (e.code === 'Space') { e.preventDefault(); doJump(); }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

let isMouseDown = false, lastMouseX = 0, lastMouseY = 0;
window.addEventListener('mousedown', (e) => {
  if (e.target.closest('#mobile-controls') || e.target.closest('#center-msg')) return;
  isMouseDown = true; lastMouseX = e.clientX; lastMouseY = e.clientY;
});
window.addEventListener('mousemove', (e) => {
  if (!isMouseDown) return;
  camAngleH -= (e.clientX - lastMouseX) * 0.006;
  camAngleV = Math.max(0.1, Math.min(1.2, camAngleV + (e.clientY - lastMouseY) * 0.006));
  lastMouseX = e.clientX; lastMouseY = e.clientY;
});
window.addEventListener('mouseup', () => { isMouseDown = false; });

// Roblox Virtual Joystick
const joyZone = document.getElementById('joystick-zone');
const joyStick = document.getElementById('joystick-stick');
let joyTouchId = null, joyCenter = { x: 0, y: 0 };
joyZone.addEventListener('touchstart', (e) => {
  e.preventDefault(); initAudio();
  const t = e.changedTouches[0]; joyTouchId = t.identifier;
  const r = joyZone.getBoundingClientRect(); joyCenter = { x: r.left + r.width/2, y: r.top + r.height/2 };
  updateJoystick(t.clientX, t.clientY);
}, { passive: false });
window.addEventListener('touchmove', (e) => {
  if (joyTouchId === null) return;
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === joyTouchId) { updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY); break; }
  }
}, { passive: false });
const endJoy = () => { joyTouchId = null; input.moveX = 0; input.moveZ = 0; joyStick.style.transform = 'translate(0px, 0px)'; };
window.addEventListener('touchend', endJoy); window.addEventListener('touchcancel', endJoy);

function updateJoystick(cx, cy) {
  const dx = cx - joyCenter.x, dy = cy - joyCenter.y;
  const dist = Math.sqrt(dx*dx + dy*dy), angle = Math.atan2(dy, dx), clamped = Math.min(dist, 50);
  joyStick.style.transform = 'translate(' + Math.cos(angle)*clamped + 'px,' + Math.sin(angle)*clamped + 'px)';
  input.moveX = (Math.cos(angle)*clamped) / 50;
  input.moveZ = (Math.sin(angle)*clamped) / 50;
}

function doJump() {
  if (player.onGround) { player.vel.y = player.jumpPower; player.onGround = false; sound.jump(); }
}
const jumpBtn = document.getElementById('jump-button');
jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); doJump(); }, { passive: false });
jumpBtn.addEventListener('click', () => { initAudio(); doJump(); });

const camZone = document.getElementById('camera-touch-zone');
let camTouchId = null, lastCamX = 0, lastCamY = 0;
camZone.addEventListener('touchstart', (e) => {
  e.preventDefault(); initAudio();
  const t = e.changedTouches[0]; camTouchId = t.identifier; lastCamX = t.clientX; lastCamY = t.clientY;
}, { passive: false });
window.addEventListener('touchmove', (e) => {
  if (camTouchId === null) return;
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    if (t.identifier === camTouchId) {
      camAngleH -= (t.clientX - lastCamX) * 0.008;
      camAngleV = Math.max(0.1, Math.min(1.2, camAngleV + (t.clientY - lastCamY) * 0.008));
      lastCamX = t.clientX; lastCamY = t.clientY; break;
    }
  }
}, { passive: false });
const endCam = () => { camTouchId = null; };
window.addEventListener('touchend', endCam); window.addEventListener('touchcancel', endCam);

let coinsCollected = 0, gameWon = false, walkCycle = 0;
function resetPlayer() { player.pos.set(0, 4, 0); player.vel.set(0, 0, 0); sound.fall(); }

function updateGame() {
  platforms.forEach(p => { if (p.moving) p.mesh.position.x = p.originX + Math.sin(Date.now()*0.002*p.speed*25)*5; });
  coins.forEach(c => {
    if (!c.collected) {
      c.mesh.rotation.z += 0.03;
      if (player.pos.distanceTo(c.mesh.position) < 2.2) {
        c.collected = true; scene.remove(c.mesh); coinsCollected++; sound.coin();
        document.getElementById('coin-counter').innerText = coinsCollected + ' / ' + coins.length;
      }
    }
  });
  goalPortal.rotation.z += 0.02;
  if (!gameWon && player.pos.distanceTo(goalPortal.position) < 4.5) {
    gameWon = true; sound.win();
    document.getElementById('msg-title').innerText = '🎉 STAGE CLEAR!';
    document.getElementById('msg-desc').innerHTML = 'おめでとうございます！全アスレチックをクリア！<br>獲得コイン: ' + coinsCollected + ' / ' + coins.length;
    document.getElementById('start-btn').innerText = 'もう一度あそぶ';
    document.getElementById('center-msg').style.display = 'block';
  }

  let kx = 0, kz = 0;
  if (keys['KeyA'] || keys['ArrowLeft']) kx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) kx += 1;
  if (keys['KeyW'] || keys['ArrowUp']) kz -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) kz += 1;
  const mx = (Math.abs(kx) > 0.1 ? kx : input.moveX);
  const mz = (Math.abs(kz) > 0.1 ? kz : input.moveZ);

  const forward = new THREE.Vector3(-Math.sin(camAngleH), 0, -Math.cos(camAngleH)).normalize();
  const right = new THREE.Vector3(Math.cos(camAngleH), 0, -Math.sin(camAngleH)).normalize();
  const moveDir = new THREE.Vector3().addScaledVector(right, mx).addScaledVector(forward, -mz);

  if (moveDir.lengthSq() > 0.01) {
    moveDir.normalize();
    player.vel.x = moveDir.x * player.speed;
    player.vel.z = moveDir.z * player.speed;
    player.rotationY = Math.atan2(moveDir.x, moveDir.z);
    walkCycle += 0.25;
    leftLeg.rotation.x = Math.sin(walkCycle) * 0.6; rightLeg.rotation.x = -Math.sin(walkCycle) * 0.6;
    leftArm.rotation.x = -Math.sin(walkCycle) * 0.5; rightArm.rotation.x = Math.sin(walkCycle) * 0.5;
  } else {
    player.vel.x *= 0.7; player.vel.z *= 0.7;
    leftLeg.rotation.x *= 0.8; rightLeg.rotation.x *= 0.8; leftArm.rotation.x *= 0.8; rightArm.rotation.x *= 0.8;
  }

  player.vel.y += player.gravity; player.pos.add(player.vel);
  player.onGround = false;
  const pHalfW = 0.8, pHalfD = 0.6, playerBottom = player.pos.y - 1.5;

  platforms.forEach(p => {
    const px = p.mesh.position.x, py = p.mesh.position.y, pz = p.mesh.position.z, topY = py + p.h / 2;
    if (player.pos.x + pHalfW > px - p.w/2 && player.pos.x - pHalfW < px + p.w/2 &&
        player.pos.z + pHalfD > pz - p.d/2 && player.pos.z - pHalfD < pz + p.d/2) {
      if (playerBottom <= topY && playerBottom >= topY - 1.2 && player.vel.y <= 0) {
        player.pos.y = topY + 1.5; player.vel.y = 0; player.onGround = true;
      }
    }
  });

  if (player.pos.y < -15) resetPlayer();
  playerGroup.position.copy(player.pos);
  playerGroup.rotation.y = player.rotationY;

  const targetCamPos = new THREE.Vector3(
    player.pos.x + Math.sin(camAngleH) * Math.cos(camAngleV) * camDist,
    player.pos.y + Math.sin(camAngleV) * camDist + 1.8,
    player.pos.z + Math.cos(camAngleH) * Math.cos(camAngleV) * camDist
  );
  camera.position.lerp(targetCamPos, 0.15);
  camera.lookAt(player.pos.x, player.pos.y + 1.2, player.pos.z);
}

function animate() {
  requestAnimationFrame(animate);
  updateGame();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('start-btn').addEventListener('click', () => {
  initAudio();
  document.getElementById('center-msg').style.display = 'none';
  if (gameWon) { gameWon = false; resetPlayer(); }
});
</script>
</body>
</html>`;
