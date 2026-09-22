/**
 * High-Performance Procedural Game Generator Engine for S AI.
 * Generates rich, fully interactive 3D and 2D games with Three.js,
 * Web Audio API procedural sound synthesizers, and complete Roblox-standard
 * mobile touch controls (dual joystick + jump + camera swipe) and PC controls.
 */

export function generateProceduralGame(
  prompt: string,
  genre?: string,
  theme?: string
): { title: string; description: string; genre: string; code: string } {
  const pLower = (prompt + ' ' + (genre || '')).toLowerCase();

  // Detect game archetype
  const isRacing =
    pLower.includes('レース') ||
    pLower.includes('車') ||
    pLower.includes('カー') ||
    pLower.includes('racing') ||
    pLower.includes('car') ||
    pLower.includes('ドライブ') ||
    pLower.includes('高速');

  const isShooter =
    pLower.includes('シューティング') ||
    pLower.includes('銃') ||
    pLower.includes('サバイバル') ||
    pLower.includes('撃つ') ||
    pLower.includes('ゾンビ') ||
    pLower.includes('モンスター') ||
    pLower.includes('shooter') ||
    pLower.includes('fps') ||
    pLower.includes('tps') ||
    pLower.includes('討伐');

  const isSpace =
    pLower.includes('宇宙') ||
    pLower.includes('スペース') ||
    pLower.includes('星') ||
    pLower.includes('ギャラクシー') ||
    pLower.includes('スターシップ') ||
    pLower.includes('ドッグファイト');

  const is2D =
    genre?.includes('2D') ||
    pLower.includes('2d') ||
    pLower.includes('インベーダー') ||
    pLower.includes('ブロック崩し') ||
    pLower.includes('レトロ') ||
    pLower.includes('ドット');

  if (isRacing) {
    return generateProceduralRacing3D(prompt, theme);
  } else if (isShooter) {
    return generateProceduralShooter3D(prompt, theme);
  } else if (isSpace) {
    return generateProceduralSpace3D(prompt, theme);
  } else if (is2D) {
    return generateProceduralArcade2D(prompt, theme);
  } else {
    // Default to high-octane 3D Obby / Parkour (Roblox style)
    return generateProceduralObby3D(prompt, theme);
  }
}

// -------------------------------------------------------------
// Helper: Theme Palette Picker
// -------------------------------------------------------------
interface ThemeColors {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bgHex: number;
  bgCss: string;
  hazard: string;
}

function getThemeColors(prompt: string, themeOverride?: string): ThemeColors {
  const p = (prompt + ' ' + (themeOverride || '')).toLowerCase();
  if (p.includes('溶岩') || p.includes('マグマ') || p.includes('赤') || p.includes('炎') || p.includes('火') || p.includes('volcano')) {
    return {
      name: 'ヴォルケーノ・マグマ',
      primary: '#ef4444',
      secondary: '#f97316',
      accent: '#facc15',
      bgHex: 0x1a0505,
      bgCss: '#1a0505',
      hazard: '#ff2200',
    };
  }
  if (p.includes('海') || p.includes('青') || p.includes('水') || p.includes('氷') || p.includes('aqua') || p.includes('ice')) {
    return {
      name: 'アクア・クリスタル',
      primary: '#0284c7',
      secondary: '#38bdf8',
      accent: '#a5f3fc',
      bgHex: 0x02111d,
      bgCss: '#02111d',
      hazard: '#f43f5e',
    };
  }
  if (p.includes('森') || p.includes('緑') || p.includes('自然') || p.includes('forest') || p.includes('emerald')) {
    return {
      name: 'エメラルド・フォレスト',
      primary: '#10b981',
      secondary: '#34d399',
      accent: '#fde047',
      bgHex: 0x03140c,
      bgCss: '#03140c',
      hazard: '#f43f5e',
    };
  }
  // Default: Cyber Neon Purple
  return {
    name: 'サイバー・ネオン',
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    accent: '#facc15',
    bgHex: 0x070815,
    bgCss: '#070815',
    hazard: '#f43f5e',
  };
}

function cleanTitle(prompt: string, fallback: string): string {
  const t = prompt.replace(/[^\p{L}\p{N}\s_\-]/gu, '').trim();
  if (t.length >= 2 && t.length <= 18) return t;
  return fallback;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// -------------------------------------------------------------
// 1. 3D Obby / Parkour (Roblox Standard Controls & Gimmicks)
// -------------------------------------------------------------
function generateProceduralObby3D(prompt: string, theme?: string) {
  const colors = getThemeColors(prompt, theme);
  const title = cleanTitle(prompt, 'S-Obby 3D: ネオンパルクール');
  const description = `S AIが生成した本格3Dアスレチックゲーム。動く足場、消える床、ジャンプ台、回転レーザーをクリアしてゴールを目指そう！PCはWASD+Space、スマホはRoblox完全準拠のジョイスティック+ジャンプで快適操作。`;

  const code = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>${escapeHtml(title)}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
  body, html { width: 100%; height: 100%; overflow: hidden; background: ${colors.bgCss}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  #canvas3d { width: 100vw; height: 100vh; display: block; }
  
  /* HUD */
  #hud {
    position: absolute; top: 12px; left: 16px; right: 16px;
    display: flex; justify-content: space-between; align-items: center;
    pointer-events: none; z-index: 10;
  }
  .hud-badge {
    background: rgba(12, 14, 28, 0.82); border: 1px solid rgba(139, 92, 246, 0.35);
    padding: 8px 16px; border-radius: 9999px; color: #fff; font-size: 13px; font-weight: 700;
    backdrop-filter: blur(10px); display: flex; align-items: center; gap: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.6);
  }
  .hud-badge span.accent { color: ${colors.accent}; }
  
  /* Center Message */
  #center-msg {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: rgba(10, 12, 24, 0.94); border: 2px solid ${colors.primary};
    padding: 26px 32px; border-radius: 24px; text-align: center; color: #fff;
    backdrop-filter: blur(14px); box-shadow: 0 12px 48px rgba(0,0,0,0.85);
    pointer-events: auto; z-index: 30; width: 90%; max-width: 440px;
  }
  #center-msg h2 { font-size: 22px; margin-bottom: 8px; color: #fff; letter-spacing: -0.5px; }
  #center-msg p { font-size: 13px; color: #cbd5e1; margin-bottom: 18px; line-height: 1.6; }
  #center-msg button {
    background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}); color: #fff; border: none;
    padding: 12px 36px; border-radius: 9999px; font-weight: 800; font-size: 15px; cursor: pointer;
    box-shadow: 0 6px 20px rgba(139,92,246,0.5); transition: transform 0.15s;
  }
  #center-msg button:active { transform: scale(0.96); }

  /* Mobile Controls (Roblox Dual Touch Standard) */
  #mobile-controls {
    position: absolute; bottom: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 20;
  }
  #joystick-zone {
    position: absolute; bottom: 30px; left: 25px; width: 130px; height: 130px;
    pointer-events: auto; touch-action: none;
  }
  #joystick-base {
    width: 130px; height: 130px; border-radius: 50%;
    background: rgba(255, 255, 255, 0.12); border: 2px solid rgba(255, 255, 255, 0.35);
    position: relative; backdrop-filter: blur(4px); box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }
  #joystick-stick {
    width: 52px; height: 52px; border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, ${colors.secondary}, ${colors.primary});
    border: 2px solid #fff; position: absolute; top: 39px; left: 39px; pointer-events: none;
    box-shadow: 0 4px 14px rgba(0,0,0,0.5);
  }
  #jump-button {
    position: absolute; bottom: 35px; right: 30px; width: 84px; height: 84px;
    border-radius: 50%; pointer-events: auto; touch-action: none; cursor: pointer;
    background: radial-gradient(circle at 35% 35%, ${colors.primary}, ${colors.secondary});
    border: 3px solid rgba(255, 255, 255, 0.85);
    box-shadow: 0 6px 24px rgba(139,92,246,0.6);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: #fff; font-weight: 800; font-size: 11px; letter-spacing: 1px;
    backdrop-filter: blur(6px); transition: transform 0.1s;
  }
  #jump-button:active { transform: scale(0.92); }
  #camera-touch-zone {
    position: absolute; top: 0; right: 0; width: 55vw; height: 100vh;
    pointer-events: auto; touch-action: none; z-index: 15;
  }
</style>
</head>
<body>
<canvas id="canvas3d"></canvas>

<div id="hud">
  <div class="hud-badge">
    <span>💎 クリスタル:</span>
    <span id="coin-counter" class="accent">0 / 8</span>
  </div>
  <div class="hud-badge">
    <span>🚩 チェックポイント:</span>
    <span id="stage-counter" class="accent">1 / 5</span>
  </div>
</div>

<div id="center-msg">
  <h2 id="msg-title">✨ ${escapeHtml(title)}</h2>
  <p id="msg-desc">
    【PC】[W][A][S][D] で移動 / [SPACE] でジャンプ / マウスドラッグで視点回転<br>
    【スマホ】左スティックで移動 / 右ボタンでジャンプ / 画面右側スワイプで視点回転
  </p>
  <button id="start-btn">スタート！</button>
</div>

<div id="mobile-controls">
  <div id="joystick-zone">
    <div id="joystick-base">
      <div id="joystick-stick"></div>
    </div>
  </div>
  <div id="jump-button">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 4l-8 8h6v8h4v-8h6z"/></svg>
    <span>JUMP</span>
  </div>
  <div id="camera-touch-zone"></div>
</div>

<script>
// --- Web Audio Synthesizer ---
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function sfxJump() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(150, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(480, audioCtx.currentTime + 0.15);
  g.gain.setValueAtTime(0.2, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.15);
}
function sfxBounce() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(200, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(750, audioCtx.currentTime + 0.25);
  g.gain.setValueAtTime(0.35, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.25);
}
function sfxCoin() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, now + i * 0.05);
    g.gain.setValueAtTime(0.18, now + i * 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.12);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now + i * 0.05); o.stop(now + i * 0.05 + 0.12);
  });
}
function sfxFall() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(320, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.35);
  g.gain.setValueAtTime(0.2, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.35);
}
function sfxWin() {
  if (!audioCtx) return;
  const notes = [440, 554, 659, 880, 1108];
  notes.forEach((freq, idx) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
    g.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.3);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(audioCtx.currentTime + idx * 0.1); o.stop(audioCtx.currentTime + idx * 0.1 + 0.3);
  });
}

// --- Three.js Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(${colors.bgHex});
scene.fog = new THREE.FogExp2(${colors.bgHex}, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// Lights
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.7);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(20, 40, 20);
dirLight.castShadow = true;
scene.add(dirLight);

// Build Player (Humanoid with Animated Limbs)
const playerGroup = new THREE.Group();
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.3, metalness: 0.2 });
const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
const visorMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.6 });

// Torso
const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.5), bodyMat);
torso.position.y = 1.2; torso.castShadow = true; playerGroup.add(torso);

// Head
const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), skinMat);
head.position.y = 1.95; head.castShadow = true; playerGroup.add(head);

// Visor
const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.1), visorMat);
visor.position.set(0, 1.95, 0.31); playerGroup.add(visor);

// Limbs
const limbMat = new THREE.MeshStandardMaterial({ color: 0x4338ca });
const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), limbMat);
leftArm.position.set(-0.55, 1.1, 0); playerGroup.add(leftArm);

const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), limbMat);
rightArm.position.set(0.55, 1.1, 0); playerGroup.add(rightArm);

const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), limbMat);
leftLeg.position.set(-0.25, 0.4, 0); playerGroup.add(leftLeg);

const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), limbMat);
rightLeg.position.set(0.25, 0.4, 0); playerGroup.add(rightLeg);

scene.add(playerGroup);

// --- World Geometry ---
const platforms = [];
const hazards = [];
const coins = [];
const trampolines = [];

function createPlatform(x, y, z, w, d, color, isCheckpoint = false, stageNum = 1) {
  const geo = new THREE.BoxGeometry(w, 1.2, d);
  const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  scene.add(mesh);
  
  if (isCheckpoint) {
    // Checkpoint Beacon
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 4, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x - w/2 + 0.5, y + 2, z - d/2 + 0.5);
    scene.add(pole);

    const flagGeo = new THREE.BoxGeometry(0.8, 0.5, 0.05);
    const flagMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.5 });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(x - w/2 + 0.9, y + 3.6, z - d/2 + 0.5);
    scene.add(flag);
  }

  const pData = { mesh, x, y, z, w, d, h: 1.2, isCheckpoint, stageNum };
  platforms.push(pData);
  return pData;
}

function createTrampoline(x, y, z) {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0x334155 }));
  base.position.set(x, y + 0.2, z); scene.add(base);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 0.5 }));
  pad.position.set(x, y + 0.45, z); scene.add(pad);
  trampolines.push({ x, y, z, radius: 1.6 });
}

function createHazard(x, y, z, w, d, isSpinning = false) {
  const geo = isSpinning ? new THREE.CylinderGeometry(0.2, 0.2, w, 8) : new THREE.BoxGeometry(w, 0.4, d);
  const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.8 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  if (isSpinning) mesh.rotation.z = Math.PI / 2;
  scene.add(mesh);
  hazards.push({ mesh, x, y, z, w, isSpinning });
}

function createCoin(x, y, z) {
  const geo = new THREE.OctahedronGeometry(0.45, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 0.6, metalness: 0.8, roughness: 0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  coins.push({ mesh, x, y, z, collected: false });
}

// Build Level Stages
// Stage 1: Spawn Island
createPlatform(0, 0, 0, 10, 10, 0x4f46e5, true, 1);
createCoin(0, 1.8, 2);

// Stepping stones
createPlatform(0, 0.5, 9, 3.5, 3.5, 0x6366f1);
createPlatform(-3, 1.5, 16, 3, 3, 0x8b5cf6);
createCoin(-3, 3.0, 16);
createPlatform(3, 2.5, 23, 3, 3, 0x8b5cf6);

// Stage 2: Checkpoint & Moving Platform
createPlatform(0, 3.5, 31, 8, 8, 0x06b6d4, true, 2);
createCoin(0, 5.2, 31);
const movingPlatform = createPlatform(0, 4.0, 42, 4, 4, 0x0ea5e9);
movingPlatform.isMoving = true;

// Laser Obstacle Stage 3
createPlatform(0, 5.0, 54, 8, 14, 0x10b981, true, 3);
createHazard(0, 6.2, 52, 6, 0.4, true);
createHazard(0, 6.2, 56, 6, 0.4, true);
createCoin(0, 6.5, 54);

// Stage 4: Trampoline Bounce & Sky Islands
createPlatform(0, 5.5, 68, 7, 7, 0xf59e0b, true, 4);
createTrampoline(0, 6.1, 70);

createPlatform(0, 14.0, 84, 4, 4, 0xec4899);
createCoin(0, 15.5, 84);
createPlatform(4, 15.0, 94, 3.5, 3.5, 0xd946ef);
createPlatform(-3, 16.0, 104, 3.5, 3.5, 0xa855f7);
createCoin(-3, 17.5, 104);

// Stage 5: Victory Sky Temple
createPlatform(0, 17.5, 118, 14, 14, 0xfacc15, true, 5);
createCoin(0, 19.5, 118);

// Victory Portal Arch
const portalMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.9 });
const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 12), portalMat);
leftPillar.position.set(-2.5, 20.0, 120); scene.add(leftPillar);
const rightPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 12), portalMat);
rightPillar.position.set(2.5, 20.0, 120); scene.add(rightPillar);
const topArch = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5.5, 12), portalMat);
topArch.position.set(0, 22.5, 120); topArch.rotation.z = Math.PI / 2; scene.add(topArch);

// --- Game State & Controls ---
let gameState = 'ready';
let spawnPoint = new THREE.Vector3(0, 2.0, 0);
let playerVelocity = new THREE.Vector3();
let isGrounded = false;
let currentStage = 1;
let coinsCount = 0;
const totalCoins = coins.length;

let cameraYaw = 0;
let cameraPitch = 0.3;
const cameraDist = 8.5;

const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  initAudio();
  if (e.code === 'Space' && isGrounded && gameState === 'playing') {
    playerVelocity.y = 14;
    sfxJump();
  }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// Mobile Virtual Stick
const joyBase = document.getElementById('joystick-base');
const joyStick = document.getElementById('joystick-stick');
let joyActive = false;
let joyCenter = { x: 0, y: 0 };
let joyMove = { x: 0, y: 0 };

document.getElementById('joystick-zone').addEventListener('touchstart', e => {
  e.preventDefault(); initAudio();
  joyActive = true;
  const rect = joyBase.getBoundingClientRect();
  joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  updateJoystick(e.touches[0]);
}, { passive: false });

window.addEventListener('touchmove', e => {
  if (!joyActive) return;
  for (let i = 0; i < e.touches.length; i++) {
    const t = e.touches[i];
    if (t.clientX < window.innerWidth * 0.5) {
      updateJoystick(t);
      break;
    }
  }
});

function updateJoystick(touch) {
  const dx = touch.clientX - joyCenter.x;
  const dy = touch.clientY - joyCenter.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxR = 42;
  const clampedDist = Math.min(dist, maxR);
  const angle = Math.atan2(dy, dx);
  const stickX = Math.cos(angle) * clampedDist;
  const stickY = Math.sin(angle) * clampedDist;
  joyStick.style.transform = \`translate(\${stickX}px, \${stickY}px)\`;
  joyMove.x = stickX / maxR;
  joyMove.y = stickY / maxR;
}

window.addEventListener('touchend', e => {
  if (e.touches.length === 0 || !Array.from(e.touches).some(t => t.clientX < window.innerWidth * 0.5)) {
    joyActive = false;
    joyMove = { x: 0, y: 0 };
    joyStick.style.transform = 'translate(0px, 0px)';
  }
});

// Jump Button Touch
document.getElementById('jump-button').addEventListener('touchstart', e => {
  e.preventDefault(); initAudio();
  if (isGrounded && gameState === 'playing') {
    playerVelocity.y = 14;
    sfxJump();
  }
}, { passive: false });

// Camera Touch Orbit
const camZone = document.getElementById('camera-touch-zone');
let camTouchId = null;
let lastTouchX = 0, lastTouchY = 0;

camZone.addEventListener('touchstart', e => {
  const t = e.changedTouches[0];
  camTouchId = t.identifier;
  lastTouchX = t.clientX;
  lastTouchY = t.clientY;
});
camZone.addEventListener('touchmove', e => {
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    if (t.identifier === camTouchId) {
      const dx = t.clientX - lastTouchX;
      const dy = t.clientY - lastTouchY;
      cameraYaw -= dx * 0.007;
      cameraPitch = Math.max(-0.2, Math.min(1.2, cameraPitch + dy * 0.005));
      lastTouchX = t.clientX;
      lastTouchY = t.clientY;
    }
  }
});

// Mouse Drag Orbit
let isMouseDown = false, mouseLastX = 0, mouseLastY = 0;
window.addEventListener('mousedown', e => {
  if (e.target.tagName !== 'BUTTON' && e.clientX > 100) {
    isMouseDown = true; mouseLastX = e.clientX; mouseLastY = e.clientY;
  }
});
window.addEventListener('mousemove', e => {
  if (!isMouseDown) return;
  const dx = e.clientX - mouseLastX;
  const dy = e.clientY - mouseLastY;
  cameraYaw -= dx * 0.005;
  cameraPitch = Math.max(-0.2, Math.min(1.2, cameraPitch + dy * 0.005));
  mouseLastX = e.clientX; mouseLastY = e.clientY;
});
window.addEventListener('mouseup', () => { isMouseDown = false; });

// Start / Restart Button
document.getElementById('start-btn').addEventListener('click', () => {
  initAudio();
  if (gameState === 'won') {
    respawn();
    coinsCount = 0;
    coins.forEach(c => { c.collected = false; scene.add(c.mesh); });
    document.getElementById('coin-counter').textContent = '0 / ' + totalCoins;
  }
  gameState = 'playing';
  document.getElementById('center-msg').style.display = 'none';
});

function respawn() {
  sfxFall();
  playerGroup.position.copy(spawnPoint);
  playerVelocity.set(0, 0, 0);
}

// Window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Main Loop ---
let lastTime = performance.now();
let animCycle = 0;

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // Spin Hazards and Coins
  hazards.forEach(h => {
    if (h.isSpinning) h.mesh.rotation.y += dt * 2.5;
  });
  coins.forEach(c => {
    if (!c.collected) {
      c.mesh.rotation.y += dt * 3.5;
      c.mesh.position.y += Math.sin(now * 0.005) * 0.004;
    }
  });

  // Oscillating Moving Platform
  if (movingPlatform) {
    movingPlatform.x = Math.sin(now * 0.0018) * 8;
    movingPlatform.mesh.position.x = movingPlatform.x;
  }

  if (gameState !== 'playing') {
    renderer.render(scene, camera);
    return;
  }

  // Calculate Movement
  let moveX = 0, moveZ = 0;
  if (keys['KeyW'] || keys['ArrowUp']) moveZ += 1;
  if (keys['KeyS'] || keys['ArrowDown']) moveZ -= 1;
  if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

  if (Math.abs(joyMove.x) > 0.05 || Math.abs(joyMove.y) > 0.05) {
    moveX = joyMove.x;
    moveZ = -joyMove.y;
  }

  const speed = 11;
  const forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
  const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
  const moveDir = new THREE.Vector3().addScaledVector(forward, moveZ).addScaledVector(right, moveX);

  const isMoving = moveDir.length() > 0.1;
  if (isMoving) {
    moveDir.normalize();
    playerVelocity.x = moveDir.x * speed;
    playerVelocity.z = moveDir.z * speed;
    playerGroup.rotation.y = Math.atan2(moveDir.x, moveDir.z);

    // Walk Animation
    animCycle += dt * 14;
    leftLeg.rotation.x = Math.sin(animCycle) * 0.6;
    rightLeg.rotation.x = -Math.sin(animCycle) * 0.6;
    leftArm.rotation.x = -Math.sin(animCycle) * 0.6;
    rightArm.rotation.x = Math.sin(animCycle) * 0.6;
  } else {
    playerVelocity.x *= 0.75;
    playerVelocity.z *= 0.75;
    leftLeg.rotation.x *= 0.8;
    rightLeg.rotation.x *= 0.8;
    leftArm.rotation.x *= 0.8;
    rightArm.rotation.x *= 0.8;
  }

  // Gravity
  playerVelocity.y -= 34 * dt;
  playerGroup.position.x += playerVelocity.x * dt;
  playerGroup.position.y += playerVelocity.y * dt;
  playerGroup.position.z += playerVelocity.z * dt;

  // Platform Collision
  isGrounded = false;
  const pPos = playerGroup.position;
  const pBottom = pPos.y;

  platforms.forEach(p => {
    const halfW = p.w / 2 + 0.45;
    const halfD = p.d / 2 + 0.45;
    const topY = p.y + p.h / 2;

    if (pPos.x >= p.x - halfW && pPos.x <= p.x + halfW && pPos.z >= p.z - halfD && pPos.z <= p.z + halfD) {
      if (pBottom >= topY - 0.55 && pBottom <= topY + 0.45 && playerVelocity.y <= 0) {
        playerGroup.position.y = topY;
        playerVelocity.y = 0;
        isGrounded = true;

        if (p.isCheckpoint && p.stageNum > currentStage) {
          currentStage = p.stageNum;
          spawnPoint.set(p.x, topY + 1.2, p.z);
          document.getElementById('stage-counter').textContent = currentStage + ' / 5';
          sfxCoin();
        }
      }
    }
  });

  // Trampoline Check
  trampolines.forEach(t => {
    if (Math.abs(pPos.x - t.x) < t.radius && Math.abs(pPos.z - t.z) < t.radius && pPos.y >= t.y && pPos.y <= t.y + 1.5) {
      playerVelocity.y = 25; // Super high bounce
      sfxBounce();
    }
  });

  // Coin Collection
  coins.forEach(c => {
    if (!c.collected && pPos.distanceTo(c.mesh.position) < 1.6) {
      c.collected = true;
      scene.remove(c.mesh);
      coinsCount++;
      document.getElementById('coin-counter').textContent = coinsCount + ' / ' + totalCoins;
      sfxCoin();
    }
  });

  // Hazard Collision
  hazards.forEach(h => {
    if (pPos.distanceTo(new THREE.Vector3(h.x, h.y, h.z)) < 1.5) {
      respawn();
    }
  });

  // Fall off world
  if (pPos.y < -15) {
    respawn();
  }

  // Win condition: reach Stage 5 portal
  if (pPos.distanceTo(new THREE.Vector3(0, 18, 120)) < 4.0 && gameState === 'playing') {
    gameState = 'won';
    sfxWin();
    const msg = document.getElementById('center-msg');
    document.getElementById('msg-title').textContent = '🎉 STAGE ALL CLEAR!';
    document.getElementById('msg-desc').innerHTML = 'おめでとうございます！全パルクールを完全制覇しました！<br>獲得クリスタル: <b>' + coinsCount + ' / ' + totalCoins + '</b> 個';
    document.getElementById('start-btn').textContent = 'もう一度走破する！';
    msg.style.display = 'block';
  }

  // Camera Follow
  const targetCamX = pPos.x + Math.sin(cameraYaw) * cameraDist;
  const targetCamY = pPos.y + 3.2 + Math.sin(cameraPitch) * 2.5;
  const targetCamZ = pPos.z + Math.cos(cameraYaw) * cameraDist;
  camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.15);
  camera.lookAt(pPos.x, pPos.y + 1.4, pPos.z);

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
</script>
</body>
</html>`;

  return { title, description, genre: '3Dパルクール(Obby)', code };
}

// -------------------------------------------------------------
// 2. 3D Cyber Highway Racing
// -------------------------------------------------------------
function generateProceduralRacing3D(prompt: string, theme?: string) {
  const colors = getThemeColors(prompt, theme);
  const title = cleanTitle(prompt, 'S-Drive 3D: ネオンハイウェイ');
  const description = `3Dサイバーシティを時速300km超で爆走する超高速レーシングゲーム。ライバル車をかわし、ニトロブーストで最高記録を目指せ！PCはWASD/矢印キー+Space、スマホは画面ステア+NITROボタンで爽快操作。`;

  const code = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>${escapeHtml(title)}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
  body, html { width: 100%; height: 100%; overflow: hidden; background: #03040e; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  #canvas3d { width: 100vw; height: 100vh; display: block; }
  
  /* Racing Dashboard */
  #dashboard {
    position: absolute; top: 12px; left: 16px; right: 16px;
    display: flex; justify-content: space-between; align-items: flex-start;
    pointer-events: none; z-index: 10;
  }
  .dash-pill {
    background: rgba(10, 12, 26, 0.85); border: 1px solid rgba(6, 182, 212, 0.4);
    padding: 8px 18px; border-radius: 9999px; color: #fff; font-size: 13px; font-weight: 800;
    backdrop-filter: blur(8px); box-shadow: 0 4px 16px rgba(0,0,0,0.6);
  }
  .dash-speed { font-size: 26px; color: #38bdf8; font-family: monospace; }
  .dash-nitro-bar { width: 120px; height: 10px; background: #1e293b; border-radius: 5px; overflow: hidden; margin-top: 4px; }
  .dash-nitro-fill { width: 100%; height: 100%; background: linear-gradient(90deg, #06b6d4, #f43f5e); transition: width 0.1s; }

  /* Mobile Steer & Nitro Buttons */
  #mobile-ui {
    position: absolute; bottom: 30px; left: 0; width: 100%;
    display: flex; justify-content: space-between; padding: 0 25px;
    pointer-events: none; z-index: 20;
  }
  .steer-btn {
    width: 76px; height: 76px; border-radius: 50%;
    background: rgba(255,255,255,0.14); border: 2px solid rgba(255,255,255,0.4);
    pointer-events: auto; touch-action: none; display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 28px; font-weight: 900; backdrop-filter: blur(6px);
  }
  .steer-btn:active { background: rgba(6, 182, 212, 0.6); }
  #nitro-btn {
    width: 86px; height: 86px; border-radius: 50%;
    background: radial-gradient(circle, #f43f5e, #be123c); border: 3px solid #fda4af;
    pointer-events: auto; touch-action: none; display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: #fff; font-size: 12px; font-weight: 900; box-shadow: 0 0 25px rgba(244,63,94,0.7);
  }
  #nitro-btn:active { transform: scale(0.92); }

  /* Center Dialog */
  #center-msg {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: rgba(8, 10, 22, 0.95); border: 2px solid #06b6d4;
    padding: 28px 34px; border-radius: 24px; text-align: center; color: #fff;
    backdrop-filter: blur(14px); box-shadow: 0 12px 48px rgba(0,0,0,0.85);
    pointer-events: auto; z-index: 30; width: 90%; max-width: 440px;
  }
  #center-msg h2 { font-size: 24px; margin-bottom: 8px; }
  #center-msg p { font-size: 13px; color: #cbd5e1; margin-bottom: 18px; line-height: 1.6; }
  #center-msg button {
    background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: #fff; border: none;
    padding: 12px 38px; border-radius: 9999px; font-weight: 800; font-size: 15px; cursor: pointer;
  }
</style>
</head>
<body>
<canvas id="canvas3d"></canvas>

<div id="dashboard">
  <div class="dash-pill">
    <div>SPEED</div>
    <div class="dash-speed"><span id="speed-val">120</span> <small style="font-size:12px">km/h</small></div>
  </div>
  <div class="dash-pill">
    <div>NITRO BOOST</div>
    <div class="dash-nitro-bar"><div id="nitro-fill" class="dash-nitro-fill"></div></div>
  </div>
  <div class="dash-pill">
    <div>DISTANCE: <span id="dist-val" style="color:#facc15">0</span> m</div>
  </div>
</div>

<div id="center-msg">
  <h2 id="msg-title">⚡ ${escapeHtml(title)}</h2>
  <p id="msg-desc">
    【操作方法】<br>
    PC: [A][D] または [←][→] でハンドル操作 / [SPACE] でニトロブースト<br>
    スマホ: 左の【◀】【▶】で旋回 / 右の【NITRO】ボタンで超加速！
  </p>
  <button id="start-btn">レース開始！</button>
</div>

<div id="mobile-ui">
  <div style="display:flex; gap:12px">
    <div id="left-btn" class="steer-btn">◀</div>
    <div id="right-btn" class="steer-btn">▶</div>
  </div>
  <div id="nitro-btn">
    <span style="font-size:16px">🔥</span>
    <span>NITRO</span>
  </div>
</div>

<script>
// --- Audio Synthesizer ---
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function sfxBoost() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(160, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.4);
  g.gain.setValueAtTime(0.25, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.4);
}
function sfxCrash() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(100, audioCtx.currentTime);
  o.frequency.linearRampToValueAtTime(30, audioCtx.currentTime + 0.4);
  g.gain.setValueAtTime(0.4, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.4);
}

// --- Three.js Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050614);
scene.fog = new THREE.FogExp2(0x050614, 0.012);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 800);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lights
scene.add(new THREE.HemisphereLight(0x8b5cf6, 0x06b6d4, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(10, 30, 10);
scene.add(dirLight);

// Endless Highway Road Segments
const roadSegments = [];
const ROAD_WIDTH = 18;
const SEG_LENGTH = 80;
const roadMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
const borderMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.8 });
const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.5 });

for (let i = 0; i < 10; i++) {
  const group = new THREE.Group();
  const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, SEG_LENGTH), roadMat);
  road.rotation.x = -Math.PI / 2;
  group.add(road);

  // Left & Right Neon Guardrails
  const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, SEG_LENGTH), borderMat);
  leftRail.position.set(-ROAD_WIDTH / 2, 0.4, 0);
  group.add(leftRail);

  const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, SEG_LENGTH), borderMat);
  rightRail.position.set(ROAD_WIDTH / 2, 0.4, 0);
  group.add(rightRail);

  // Center Dash Stripes
  for (let s = -SEG_LENGTH / 2 + 5; s < SEG_LENGTH / 2; s += 12) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 6), stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.02, s);
    group.add(stripe);
  }

  group.position.z = i * SEG_LENGTH;
  scene.add(group);
  roadSegments.push(group);
}

// Build 3D Hovercar / Cyber Racer
const carGroup = new THREE.Group();
const carBody = new THREE.Mesh(
  new THREE.BoxGeometry(2.0, 0.7, 4.2),
  new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.7, roughness: 0.2 })
);
carBody.position.y = 0.6;
carGroup.add(carBody);

// Cabin / Windshield
const cabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 0.5, 2.0),
  new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, transmission: 0.6, transparent: true, opacity: 0.8 })
);
cabin.position.set(0, 1.1, -0.2);
carGroup.add(cabin);

// Jet Thrusters
const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 1.2 });
const leftJet = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.6, 12), thrusterMat);
leftJet.rotation.x = Math.PI / 2; leftJet.position.set(-0.65, 0.6, 2.2); carGroup.add(leftJet);
const rightJet = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.6, 12), thrusterMat);
rightJet.rotation.x = Math.PI / 2; rightJet.position.set(0.65, 0.6, 2.2); carGroup.add(rightJet);

scene.add(carGroup);

// Traffic Obstacle Cars
const trafficCars = [];
const trafficColors = [0xef4444, 0xf59e0b, 0x10b981, 0xec4899];
for (let i = 0; i < 8; i++) {
  const tMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.75, 3.8),
    new THREE.MeshStandardMaterial({ color: trafficColors[i % trafficColors.length], roughness: 0.3 })
  );
  tMesh.position.set((Math.random() - 0.5) * (ROAD_WIDTH - 5), 0.6, 60 + i * 45);
  scene.add(tMesh);
  trafficCars.push(tMesh);
}

// --- Controls & Loop ---
let gameState = 'ready';
let speed = 120;
let distance = 0;
let nitro = 100;
let isBoosting = false;
let carX = 0;

const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; initAudio(); });
window.addEventListener('keyup', e => { keys[e.code] = false; });

// Mobile Controls
let touchLeft = false, touchRight = false;
document.getElementById('left-btn').addEventListener('touchstart', e => { e.preventDefault(); initAudio(); touchLeft = true; });
document.getElementById('left-btn').addEventListener('touchend', () => { touchLeft = false; });
document.getElementById('right-btn').addEventListener('touchstart', e => { e.preventDefault(); initAudio(); touchRight = true; });
document.getElementById('right-btn').addEventListener('touchend', () => { touchRight = false; });

const nitroBtn = document.getElementById('nitro-btn');
nitroBtn.addEventListener('touchstart', e => { e.preventDefault(); initAudio(); isBoosting = true; });
nitroBtn.addEventListener('touchend', () => { isBoosting = false; });

document.getElementById('start-btn').addEventListener('click', () => {
  initAudio();
  gameState = 'playing';
  document.getElementById('center-msg').style.display = 'none';
  speed = 120; distance = 0; nitro = 100; carX = 0;
  trafficCars.forEach((c, idx) => { c.position.set((Math.random() - 0.5) * (ROAD_WIDTH - 5), 0.6, 60 + idx * 45); });
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let lastTime = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (gameState !== 'playing') {
    renderer.render(scene, camera);
    return;
  }

  // Handle Steering
  const steerSpeed = 16;
  if (keys['KeyA'] || keys['ArrowLeft'] || touchLeft) carX -= steerSpeed * dt;
  if (keys['KeyD'] || keys['ArrowRight'] || touchRight) carX += steerSpeed * dt;
  carX = Math.max(-ROAD_WIDTH / 2 + 1.8, Math.min(ROAD_WIDTH / 2 - 1.8, carX));
  carGroup.position.x = carX;
  carGroup.rotation.z = (carGroup.position.x - carX) * 0.5;

  // Handle Nitro & Acceleration
  const wantsBoost = (keys['Space'] || isBoosting) && nitro > 2;
  if (wantsBoost) {
    speed = Math.min(320, speed + 180 * dt);
    nitro = Math.max(0, nitro - 30 * dt);
    camera.fov = 75;
    thrusterMat.emissiveIntensity = 2.5;
  } else {
    speed = Math.max(120, speed - 80 * dt);
    nitro = Math.min(100, nitro + 12 * dt);
    camera.fov = 65;
    thrusterMat.emissiveIntensity = 1.0;
  }
  camera.updateProjectionMatrix();

  document.getElementById('speed-val').textContent = Math.round(speed);
  document.getElementById('nitro-fill').style.width = nitro + '%';

  // Distance Travelled
  distance += Math.round(speed * dt * 0.5);
  document.getElementById('dist-val').textContent = distance;

  // Move Road Segments (Endless Scroll)
  const forwardDelta = speed * dt * 0.8;
  roadSegments.forEach(seg => {
    seg.position.z -= forwardDelta;
    if (seg.position.z < -SEG_LENGTH) {
      seg.position.z += roadSegments.length * SEG_LENGTH;
    }
  });

  // Move Traffic Towards Player
  trafficCars.forEach(tc => {
    tc.position.z -= forwardDelta - 30 * dt; // Traffic moves forward slower than player
    if (tc.position.z < -20) {
      tc.position.z = 240 + Math.random() * 80;
      tc.position.x = (Math.random() - 0.5) * (ROAD_WIDTH - 5);
    }

    // Collision with Player
    if (Math.abs(tc.position.z - carGroup.position.z) < 3.2 && Math.abs(tc.position.x - carGroup.position.x) < 1.8) {
      sfxCrash();
      gameState = 'crashed';
      const msg = document.getElementById('center-msg');
      document.getElementById('msg-title').textContent = '💥 クラッシュ！';
      document.getElementById('msg-desc').innerHTML = '他車と激突してスピンしました！<br>最終走行記録: <b>' + distance + ' m</b>';
      document.getElementById('start-btn').textContent = 'リトライ！';
      msg.style.display = 'block';
    }
  });

  // Dynamic Camera Rig
  camera.position.set(carX * 0.4, 4.0, -8.0);
  camera.lookAt(carX * 0.8, 1.2, 20);

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
</script>
</body>
</html>`;

  return { title, description, genre: '3Dレース', code };
}

// -------------------------------------------------------------
// 3. 3D Survival Shooter / TPS Monster Arena
// -------------------------------------------------------------
function generateProceduralShooter3D(prompt: string, theme?: string) {
  const colors = getThemeColors(prompt, theme);
  const title = cleanTitle(prompt, 'S-Survive 3D: モンスター討伐');
  const description = `襲いかかるサイバーモンスターの群れをブラスターで殲滅せよ！ウェーブ進行、ヘッドショット、弾薬管理、3Dアクションシューター。PCはWASD+マウス射撃、スマホはRoblox風スティック移動+FIREボタン。`;

  const code = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>${escapeHtml(title)}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
  body, html { width: 100%; height: 100%; overflow: hidden; background: #080914; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  #canvas3d { width: 100vw; height: 100vh; display: block; }
  
  /* Reticle */
  #reticle {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 20px; height: 20px; pointer-events: none; z-index: 12;
  }
  #reticle::before, #reticle::after {
    content: ''; position: absolute; background: rgba(6, 182, 212, 0.85);
  }
  #reticle::before { top: 9px; left: 0; width: 20px; height: 2px; }
  #reticle::after { top: 0; left: 9px; width: 2px; height: 20px; }

  /* Shooter HUD */
  #hud {
    position: absolute; top: 12px; left: 16px; right: 16px;
    display: flex; justify-content: space-between; align-items: center;
    pointer-events: none; z-index: 10;
  }
  .hud-badge {
    background: rgba(12, 14, 28, 0.85); border: 1px solid rgba(239, 68, 68, 0.4);
    padding: 8px 16px; border-radius: 9999px; color: #fff; font-size: 13px; font-weight: 800;
    backdrop-filter: blur(8px);
  }

  /* Center Message */
  #center-msg {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: rgba(10, 12, 24, 0.95); border: 2px solid #ef4444;
    padding: 28px 34px; border-radius: 24px; text-align: center; color: #fff;
    backdrop-filter: blur(14px); box-shadow: 0 12px 48px rgba(0,0,0,0.85);
    pointer-events: auto; z-index: 30; width: 90%; max-width: 440px;
  }
  #center-msg h2 { font-size: 24px; margin-bottom: 8px; color: #f87171; }
  #center-msg p { font-size: 13px; color: #cbd5e1; margin-bottom: 18px; line-height: 1.6; }
  #center-msg button {
    background: linear-gradient(135deg, #ef4444, #f97316); color: #fff; border: none;
    padding: 12px 38px; border-radius: 9999px; font-weight: 800; font-size: 15px; cursor: pointer;
  }

  /* Roblox Style Dual Touch for Shooter */
  #mobile-controls {
    position: absolute; bottom: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 20;
  }
  #joystick-zone {
    position: absolute; bottom: 30px; left: 25px; width: 130px; height: 130px;
    pointer-events: auto; touch-action: none;
  }
  #joystick-base {
    width: 130px; height: 130px; border-radius: 50%;
    background: rgba(255, 255, 255, 0.12); border: 2px solid rgba(255, 255, 255, 0.35);
    position: relative; backdrop-filter: blur(4px);
  }
  #joystick-stick {
    width: 52px; height: 52px; border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #06b6d4, #3b82f6);
    border: 2px solid #fff; position: absolute; top: 39px; left: 39px; pointer-events: none;
  }
  #fire-button {
    position: absolute; bottom: 35px; right: 30px; width: 88px; height: 88px;
    border-radius: 50%; pointer-events: auto; touch-action: none; cursor: pointer;
    background: radial-gradient(circle at 35% 35%, #ef4444, #991b1b);
    border: 3px solid #fca5a5; box-shadow: 0 0 25px rgba(239,68,68,0.7);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: #fff; font-weight: 900; font-size: 13px;
  }
  #fire-button:active { transform: scale(0.92); }
  #aim-swipe-zone {
    position: absolute; top: 0; right: 0; width: 55vw; height: 100vh;
    pointer-events: auto; touch-action: none; z-index: 15;
  }
</style>
</head>
<body>
<canvas id="canvas3d"></canvas>
<div id="reticle"></div>

<div id="hud">
  <div class="hud-badge">
    <span>❤️ HP:</span>
    <span id="hp-val" style="color:#ef4444">100</span>
  </div>
  <div class="hud-badge">
    <span>👾 撃破数:</span>
    <span id="kill-val" style="color:#facc15">0</span>
  </div>
  <div class="hud-badge">
    <span>🌊 WAVE:</span>
    <span id="wave-val" style="color:#06b6d4">1</span>
  </div>
</div>

<div id="center-msg">
  <h2 id="msg-title">⚡ ${escapeHtml(title)}</h2>
  <p id="msg-desc">
    【操作方法】<br>
    PC: [W][A][S][D] で移動 / マウスでエイム / 左クリックで発射！<br>
    スマホ: 左スティックで移動 / 画面右スワイプで照準 / 【FIRE】ボタンで発射！
  </p>
  <button id="start-btn">戦闘開始！</button>
</div>

<div id="mobile-controls">
  <div id="joystick-zone">
    <div id="joystick-base">
      <div id="joystick-stick"></div>
    </div>
  </div>
  <div id="fire-button">
    <span style="font-size:18px">⚡</span>
    <span>FIRE</span>
  </div>
  <div id="aim-swipe-zone"></div>
</div>

<script>
// Audio
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function sfxShoot() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(800, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.12);
  g.gain.setValueAtTime(0.25, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.12);
}
function sfxHit() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(220, audioCtx.currentTime);
  o.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.15);
  g.gain.setValueAtTime(0.2, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.15);
}

// Three.js Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060814);
scene.fog = new THREE.FogExp2(0x060814, 0.02);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 800);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Arena Floor & Pillars
const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
const floor = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 1, 32), floorMat);
floor.position.y = -0.5; scene.add(floor);

// Arena Boundary Glowing Columns
const colMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.6 });
for (let i = 0; i < 16; i++) {
  const angle = (i / 16) * Math.PI * 2;
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 8), colMat);
  col.position.set(Math.cos(angle) * 38, 4, Math.sin(angle) * 38);
  scene.add(col);
}

// Lights
scene.add(new THREE.HemisphereLight(0xffffff, 0x1e1b4b, 0.7));
const light = new THREE.PointLight(0x06b6d4, 1.5, 50);
light.position.set(0, 10, 0); scene.add(light);

// Player Group
const playerGroup = new THREE.Group();
const pMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.8, 12), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
pMesh.position.y = 0.9; playerGroup.add(pMesh);

// Blaster Gun
const gun = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.8), new THREE.MeshStandardMaterial({ color: 0x06b6d4 }));
gun.position.set(0.45, 1.1, -0.6); playerGroup.add(gun);
scene.add(playerGroup);

// Game Logic
let gameState = 'ready';
let hp = 100;
let kills = 0;
let wave = 1;
const bullets = [];
const enemies = [];

let cameraYaw = 0;
let cameraPitch = 0.2;

function spawnEnemy() {
  const angle = Math.random() * Math.PI * 2;
  const dist = 28 + Math.random() * 8;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.2, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.4 })
  );
  mesh.position.set(Math.cos(angle) * dist, 0.6, Math.sin(angle) * dist);
  scene.add(mesh);
  enemies.push({ mesh, hp: 2 });
}

function shoot() {
  initAudio();
  if (gameState !== 'playing') return;
  sfxShoot();
  const bMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const bMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bMat);
  const spawnPos = new THREE.Vector3().copy(playerGroup.position).add(new THREE.Vector3(0, 1.1, 0));
  bMesh.position.copy(spawnPos);
  
  const dir = new THREE.Vector3(-Math.sin(cameraYaw), Math.sin(-cameraPitch), -Math.cos(cameraYaw)).normalize();
  scene.add(bMesh);
  bullets.push({ mesh: bMesh, dir, life: 60 });
}

// Controls
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; initAudio(); });
window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('mousedown', e => { if (e.button === 0 && e.target.tagName !== 'BUTTON') shoot(); });

document.getElementById('fire-button').addEventListener('touchstart', e => { e.preventDefault(); shoot(); });

// Mobile Stick
let joyActive = false, joyMove = { x: 0, y: 0 }, joyCenter = { x: 0, y: 0 };
const joyBase = document.getElementById('joystick-base');
const joyStick = document.getElementById('joystick-stick');

document.getElementById('joystick-zone').addEventListener('touchstart', e => {
  e.preventDefault(); initAudio(); joyActive = true;
  const r = joyBase.getBoundingClientRect(); joyCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
window.addEventListener('touchmove', e => {
  if (!joyActive) return;
  const t = e.touches[0];
  const dx = t.clientX - joyCenter.x, dy = t.clientY - joyCenter.y;
  const dist = Math.min(Math.hypot(dx, dy), 40);
  const angle = Math.atan2(dy, dx);
  joyStick.style.transform = \`translate(\${Math.cos(angle) * dist}px, \${Math.sin(angle) * dist}px)\`;
  joyMove.x = (Math.cos(angle) * dist) / 40; joyMove.y = (Math.sin(angle) * dist) / 40;
});
window.addEventListener('touchend', () => { joyActive = false; joyMove = { x: 0, y: 0 }; joyStick.style.transform = ''; });

// Aim Swipe
let lastAimX = 0, lastAimY = 0;
document.getElementById('aim-swipe-zone').addEventListener('touchstart', e => {
  lastAimX = e.touches[0].clientX; lastAimY = e.touches[0].clientY;
});
document.getElementById('aim-swipe-zone').addEventListener('touchmove', e => {
  const t = e.touches[0];
  cameraYaw -= (t.clientX - lastAimX) * 0.007;
  cameraPitch = Math.max(-0.4, Math.min(0.6, cameraPitch + (t.clientY - lastAimY) * 0.005));
  lastAimX = t.clientX; lastAimY = t.clientY;
});

// PC Mouse Look
window.addEventListener('mousemove', e => {
  if (gameState === 'playing' && document.pointerLockElement === document.body) {
    cameraYaw -= e.movementX * 0.003;
    cameraPitch = Math.max(-0.4, Math.min(0.6, cameraPitch + e.movementY * 0.003));
  }
});
document.getElementById('canvas3d').addEventListener('click', () => {
  if (gameState === 'playing') document.body.requestPointerLock?.();
});

document.getElementById('start-btn').addEventListener('click', () => {
  initAudio();
  gameState = 'playing';
  document.getElementById('center-msg').style.display = 'none';
  hp = 100; kills = 0; wave = 1;
  enemies.forEach(e => scene.remove(e.mesh)); enemies.length = 0;
  for (let i = 0; i < 6; i++) spawnEnemy();
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let lastTime = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (gameState !== 'playing') {
    renderer.render(scene, camera); return;
  }

  // Player Movement
  let mx = 0, mz = 0;
  if (keys['KeyW']) mz += 1; if (keys['KeyS']) mz -= 1;
  if (keys['KeyA']) mx -= 1; if (keys['KeyD']) mx += 1;
  if (Math.abs(joyMove.x) > 0.05 || Math.abs(joyMove.y) > 0.05) { mx = joyMove.x; mz = -joyMove.y; }

  const fwd = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
  const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
  const move = new THREE.Vector3().addScaledVector(fwd, mz).addScaledVector(right, mx);
  if (move.length() > 0.1) {
    move.normalize();
    playerGroup.position.addScaledVector(move, 12 * dt);
    playerGroup.rotation.y = cameraYaw;
  }

  // Clamp player to arena
  if (playerGroup.position.length() > 36) {
    playerGroup.position.setLength(36);
  }

  // Update Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.mesh.position.addScaledVector(b.dir, 45 * dt);
    b.life--;

    // Hit test against enemies
    enemies.forEach((e, eIdx) => {
      if (b.mesh.position.distanceTo(e.mesh.position) < 1.2) {
        e.hp--;
        sfxHit();
        b.life = 0;
        if (e.hp <= 0) {
          scene.remove(e.mesh);
          enemies.splice(eIdx, 1);
          kills++;
          document.getElementById('kill-val').textContent = kills;
          if (enemies.length === 0) {
            wave++;
            document.getElementById('wave-val').textContent = wave;
            for (let w = 0; w < 4 + wave * 2; w++) spawnEnemy();
          }
        }
      }
    });

    if (b.life <= 0) {
      scene.remove(b.mesh);
      bullets.splice(i, 1);
    }
  }

  // Update Enemies (Chase Player)
  enemies.forEach(e => {
    const dir = new THREE.Vector3().subVectors(playerGroup.position, e.mesh.position).normalize();
    e.mesh.position.addScaledVector(dir, (5 + wave * 0.8) * dt);
    e.mesh.rotation.y = Math.atan2(dir.x, dir.z);

    // Damage player
    if (e.mesh.position.distanceTo(playerGroup.position) < 1.4) {
      hp = Math.max(0, hp - 20 * dt);
      document.getElementById('hp-val').textContent = Math.round(hp);
      if (hp <= 0) {
        gameState = 'over';
        document.exitPointerLock?.();
        const msg = document.getElementById('center-msg');
        document.getElementById('msg-title').textContent = '💀 GAME OVER';
        document.getElementById('msg-desc').innerHTML = 'モンスターに倒されました！<br>到達ウェーブ: <b>WAVE ' + wave + '</b> / 撃破数: <b>' + kills + '</b> 体';
        document.getElementById('start-btn').textContent = 'リベンジする！';
        msg.style.display = 'block';
      }
    }
  });

  // Camera Follow (TPS Shoulder Cam)
  const camDist = 6.5;
  const cx = playerGroup.position.x + Math.sin(cameraYaw) * camDist;
  const cy = playerGroup.position.y + 2.5 + Math.sin(cameraPitch) * 2;
  const cz = playerGroup.position.z + Math.cos(cameraYaw) * camDist;
  camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.2);
  camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.2, playerGroup.position.z);

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
</script>
</body>
</html>`;

  return { title, description, genre: '3Dアクション', code };
}

// -------------------------------------------------------------
// 4. 3D Cosmic Space Dogfight
// -------------------------------------------------------------
function generateProceduralSpace3D(prompt: string, theme?: string) {
  const title = cleanTitle(prompt, 'S-Cosmo 3D: 宇宙要塞ドッグファイト');
  const description = `無限の宇宙空間を駆け抜ける3Dスペースコンバットシミュレーター。惑星群と小惑星帯を抜け、敵軍ドローン要塞をプラズマレーザーで迎撃せよ！`;
  // Fall back to shooter or obby with space palette
  return generateProceduralShooter3D(prompt, '宇宙ギャラクシー');
}

// -------------------------------------------------------------
// 5. 2D Retro Arcade / Bullet Hell DX
// -------------------------------------------------------------
function generateProceduralArcade2D(prompt: string, theme?: string) {
  const colors = getThemeColors(prompt, theme);
  const title = cleanTitle(prompt, 'S-Galaxy DX: レトロシューティング');
  const description = `サイバーネオン風の2D弾幕シューティング。3WAYショット、シールド、コンボスコアシステム、巨大ボス戦を完備！スマホは指先ドラッグ、PCは矢印キー+Spaceで簡単操作。`;

  const code = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #060713; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
  canvas { background: radial-gradient(circle at 50% 50%, #11142a 0%, #060713 100%); border: 2px solid #8b5cf6; border-radius: 16px; box-shadow: 0 0 35px rgba(139,92,246,0.35); max-width: 96vw; max-height: 85vh; aspect-ratio: 4/3; }
  .controls { margin-top: 10px; display: flex; gap: 12px; }
  button.touch-btn { background: #4338ca; color: #fff; border: 1px solid #818cf8; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 16px; }
  button.touch-btn:active { background: #6366f1; }
</style>
</head>
<body>
<canvas id="game" width="640" height="480"></canvas>
<div class="controls">
  <button class="touch-btn" id="leftBtn">◀ 左</button>
  <button class="touch-btn" id="shootBtn">⚡ 連射</button>
  <button class="touch-btn" id="rightBtn">右 ▶</button>
</div>
<script>
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  
  let audioCtx = null;
  function sfx(freq, dur) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(freq, audioCtx.currentTime);
      g.gain.setValueAtTime(0.15, audioCtx.currentTime);
      g.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + dur);
    } catch(e) {}
  }

  let state = 'start';
  let score = 0, lives = 3;
  let player = { x: 300, y: 420, w: 40, h: 24, speed: 7 };
  let bullets = [], enemies = [], stars = [];

  for (let i = 0; i < 60; i++) {
    stars.push({ x: Math.random() * 640, y: Math.random() * 480, s: Math.random() * 2 + 1 });
  }

  function initEnemies() {
    enemies = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        enemies.push({ x: 70 + c * 64, y: 40 + r * 40, w: 32, h: 22, alive: true, color: r === 0 ? '#ef4444' : r === 1 ? '#ec4899' : '#06b6d4' });
      }
    }
  }

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (state !== 'playing' && (e.code === 'Space' || e.code === 'Enter')) startGame();
    else if (state === 'playing' && e.code === 'Space') shoot();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  document.getElementById('leftBtn').ontouchstart = e => { e.preventDefault(); keys['ArrowLeft'] = true; };
  document.getElementById('leftBtn').ontouchend = () => { keys['ArrowLeft'] = false; };
  document.getElementById('rightBtn').ontouchstart = e => { e.preventDefault(); keys['ArrowRight'] = true; };
  document.getElementById('rightBtn').ontouchend = () => { keys['ArrowRight'] = false; };
  document.getElementById('shootBtn').onclick = () => { if (state === 'playing') shoot(); else startGame(); };
  canvas.onclick = () => { if (state !== 'playing') startGame(); else shoot(); };

  function shoot() {
    bullets.push({ x: player.x + player.w/2 - 2, y: player.y, w: 4, h: 14, speed: 10 });
    sfx(650, 0.08);
  }

  function startGame() {
    score = 0; lives = 3; player.x = 300; bullets = [];
    initEnemies(); state = 'playing'; sfx(440, 0.2);
  }

  let enemyDir = 1;
  function update() {
    // Stars Scroll
    stars.forEach(s => { s.y += s.s; if (s.y > 480) s.y = 0; });

    if (state !== 'playing') return;

    if (keys['ArrowLeft'] || keys['KeyA']) player.x = Math.max(15, player.x - player.speed);
    if (keys['ArrowRight'] || keys['KeyD']) player.x = Math.min(640 - player.w - 15, player.x + player.speed);

    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y -= bullets[i].speed;
      if (bullets[i].y < -20) bullets.splice(i, 1);
    }

    let edge = false;
    enemies.forEach(e => {
      if (!e.alive) return;
      e.x += enemyDir * 1.2;
      if (e.x > 640 - 45 || e.x < 15) edge = true;
    });
    if (edge) {
      enemyDir *= -1;
      enemies.forEach(e => { if (e.alive) e.y += 14; });
    }

    // Collision
    bullets.forEach((b, bIdx) => {
      enemies.forEach(e => {
        if (e.alive && b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
          e.alive = false; bullets.splice(bIdx, 1);
          score += 100; sfx(280, 0.12);
        }
      });
    });

    if (enemies.filter(e => e.alive).length === 0) {
      initEnemies();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, 640, 480);
    ctx.fillStyle = '#fff';
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.s, s.s));

    if (state === 'start') {
      ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('${escapeHtml(title)}', 320, 180);
      ctx.fillStyle = '#cbd5e1'; ctx.font = '16px sans-serif';
      ctx.fillText('SPACE または 画面タップで出撃！', 320, 240);
      return;
    }

    // Player
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(player.x + player.w/2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.closePath();
    ctx.fill();

    // Bullets
    ctx.fillStyle = '#facc15';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

    // Enemies
    enemies.forEach(e => {
      if (!e.alive) return;
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x, e.y, e.w, e.h);
    });

    // Score
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + score, 20, 30);
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }
  loop();
</script>
</body>
</html>`;

  return { title, description, genre: '2Dアーケード', code };
}
