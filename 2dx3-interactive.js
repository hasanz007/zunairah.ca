(function () {

const ROOM_W = 500;
const ROOM_H = 500;
const SENSOR_X = 60;
const SENSOR_Y = 250;
const RAY_LENGTH = 420;
const OB_SIZE = 30;

let obstacles = [];
let scanPoints = [];
let isScanning = false;
let scanAngle = -90;
let animationId = null;
let hoverPos = null;
let uartLog = [];

let canvas, ctx, startBtn, resetBtn, loadRoomBtn, angleDisplay, distDisplay, uartDisplay;

const ROOMS = {
  empty: [],
  simple: [
    { x: 200, y: 150, w: 40, h: 40 },
    { x: 320, y: 300, w: 40, h: 40 },
  ],
  complex: [
    { x: 140, y: 80, w: 100, h: 20 },
    { x: 180, y: 180, w: 80, h: 20 },
    { x: 340, y: 100, w: 20, h: 120 },
    { x: 230, y: 320, w: 100, h: 20 },
    { x: 150, y: 250, w: 20, h: 70 },
  ],
  wall: [
    { x: 100, y: 60, w: 200, h: 15 },
    { x: 370, y: 60, w: 15, h: 200 },
    { x: 100, y: 370, w: 300, h: 15 },
    { x: 150, y: 150, w: 15, h: 150 },
  ],
};

function init() {
  canvas = document.getElementById('scanCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  canvas.width = ROOM_W;
  canvas.height = ROOM_H;

  startBtn = document.getElementById('scanStartBtn');
  resetBtn = document.getElementById('scanResetBtn');
  loadRoomBtn = document.getElementById('scanRoomSelect');
  angleDisplay = document.getElementById('scanAngleDisplay');
  distDisplay = document.getElementById('scanDistDisplay');
  uartDisplay = document.getElementById('scanUartDisplay');

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', () => { hoverPos = null; if (!isScanning) draw(); });
  canvas.addEventListener('click', onClick);
  startBtn.addEventListener('click', startScan);
  resetBtn.addEventListener('click', resetScan);
  loadRoomBtn.addEventListener('change', loadRoom);

  loadRoom();
}

function rayAABB(ox, oy, dx, dy, rect) {
  const t1 = (rect.x - ox) / dx;
  const t2 = (rect.x + rect.w - ox) / dx;
  const t3 = (rect.y - oy) / dy;
  const t4 = (rect.y + rect.h - oy) / dy;
  const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
  const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));
  if (tmax < 0 || tmin > tmax) return null;
  const t = tmin < 0 ? tmax : tmin;
  return t > 0.001 ? t : null;
}

function castRay(angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  let minDist = RAY_LENGTH;
  for (const obs of obstacles) {
    const t = rayAABB(SENSOR_X, SENSOR_Y, dx, dy, obs);
    if (t !== null && t < minDist) minDist = t;
  }
  return minDist;
}

function draw() {
  ctx.clearRect(0, 0, ROOM_W, ROOM_H);

  ctx.fillStyle = 'rgba(246,239,255,0.25)';
  ctx.fillRect(0, 0, ROOM_W, ROOM_H);

  ctx.strokeStyle = 'rgba(138,108,255,0.06)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= ROOM_W; x += 25) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ROOM_H); ctx.stroke(); }
  for (let y = 0; y <= ROOM_H; y += 25) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ROOM_W, y); ctx.stroke(); }

  ctx.strokeStyle = 'rgba(138,108,255,0.15)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, ROOM_W - 2, ROOM_H - 2);

  for (const obs of obstacles) {
    ctx.fillStyle = 'rgba(255,135,178,0.12)';
    ctx.strokeStyle = 'rgba(255,135,178,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.rect(obs.x, obs.y, obs.w, obs.h); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,135,178,0.08)';
    ctx.lineWidth = 0.5;
    for (let lx = obs.x + 5; lx < obs.x + obs.w; lx += 5) { ctx.beginPath(); ctx.moveTo(lx, obs.y); ctx.lineTo(lx, obs.y + obs.h); ctx.stroke(); }
  }

  if (hoverPos && !isScanning) {
    ctx.strokeStyle = 'rgba(138,108,255,0.3)';
    ctx.fillStyle = 'rgba(138,108,255,0.06)';
    ctx.setLineDash([4, 4]);
    const sx = Math.round(hoverPos.x / 5) * 5;
    const sy = Math.round(hoverPos.y / 5) * 5;
    ctx.beginPath(); ctx.rect(sx - OB_SIZE / 2, sy - OB_SIZE / 2, OB_SIZE, OB_SIZE); ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);
  }

  if (scanPoints.length > 0) {
    for (const p of scanPoints) {
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(157,222,191,0.7)';
      ctx.fill();
    }
  }

  ctx.beginPath(); ctx.arc(SENSOR_X, SENSOR_Y, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(138,108,255,0.9)';
  ctx.fill();

  if (isScanning) {
    const dist = castRay(scanAngle);
    const rad = scanAngle * Math.PI / 180;
    const endX = SENSOR_X + Math.cos(rad) * dist;
    const endY = SENSOR_Y + Math.sin(rad) * dist;

    ctx.beginPath(); ctx.moveTo(SENSOR_X, SENSOR_Y); ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(138,108,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath(); ctx.arc(endX, endY, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,135,178,0.9)';
    ctx.fill();

    angleDisplay.textContent = scanAngle.toFixed(1) + '\u00B0';
    const cm = (dist * 0.5).toFixed(1);
    distDisplay.textContent = cm + ' cm';

    const angleByte = Math.round((scanAngle + 90) / 180 * 255);
    const distInt = Math.round(dist * 5);
    const dH = (distInt >> 8) & 0xFF;
    const dL = distInt & 0xFF;
    const cs = (0xAA + angleByte + dH + dL) & 0xFF;
    const pkt = 'AA '
      + angleByte.toString(16).padStart(2, '0').toUpperCase() + ' '
      + dH.toString(16).padStart(2, '0').toUpperCase() + ' '
      + dL.toString(16).padStart(2, '0').toUpperCase() + ' '
      + cs.toString(16).padStart(2, '0').toUpperCase();

    uartLog.push(pkt);
    uartDisplay.textContent = uartLog.join('\n');
  }
}

function scanStep() {
  if (!isScanning) return;
  const rad = scanAngle * Math.PI / 180;
  const dist = castRay(scanAngle);
  const endX = SENSOR_X + Math.cos(rad) * dist;
  const endY = SENSOR_Y + Math.sin(rad) * dist;
  scanPoints.push({ x: endX, y: endY });
  scanAngle += 1;
  if (scanAngle > 90) {
    isScanning = false;
    scanAngle = 90;
    startBtn.textContent = 'Start Scan';
    draw();
    return;
  }
  draw();
  animationId = requestAnimationFrame(scanStep);
}

function startScan() {
  if (isScanning) return;
  if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
  scanAngle = -90;
  scanPoints = [];
  uartLog = [];
  isScanning = true;
  startBtn.textContent = 'Scanning...';
  draw();
  animationId = requestAnimationFrame(scanStep);
}

function resetScan() {
  if (isScanning) { isScanning = false; if (animationId) cancelAnimationFrame(animationId); animationId = null; }
  scanAngle = -90;
  scanPoints = [];
  uartLog = [];
  startBtn.textContent = 'Start Scan';
  if (angleDisplay) angleDisplay.textContent = '-';
  if (distDisplay) distDisplay.textContent = '-';
  if (uartDisplay) uartDisplay.textContent = '';
  draw();
}

function loadRoom() {
  const name = loadRoomBtn.value;
  obstacles = ROOMS[name] ? ROOMS[name].map(function (o) { return { x: o.x, y: o.y, w: o.w, h: o.h }; }) : [];
  resetScan();
}

function onMouseMove(e) {
  if (isScanning) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = ROOM_W / rect.width;
  const scaleY = ROOM_H / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  hoverPos = { x, y };
  draw();
}

function onClick(e) {
  if (isScanning) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = ROOM_W / rect.width;
  const scaleY = ROOM_H / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  const hitIdx = obstacles.findIndex(function (o) { return x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h; });
  if (hitIdx >= 0) {
    obstacles.splice(hitIdx, 1);
  } else {
    obstacles.push({ x: x - OB_SIZE / 2, y: y - OB_SIZE / 2, w: OB_SIZE, h: OB_SIZE });
  }
  loadRoomBtn.value = 'empty';
  resetScan();
  draw();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
