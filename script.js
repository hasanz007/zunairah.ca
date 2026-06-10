/* ==========================================
   Phase 3: POST Boot Screen
   ========================================== */
(function initBootScreen() {
  const screen = document.getElementById("bootScreen");
  if (!screen) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    screen.classList.add("boot-done");
    return;
  }
  if (sessionStorage.getItem("bootDone")) {
    screen.classList.add("boot-done");
    return;
  }
  const output = document.getElementById("bootOutput");
  const progress = document.getElementById("bootProgress");
  const status = document.getElementById("bootStatus");
  if (!output) return;

  const messages = [
    { text: "CPU: ZUN-ARCH x64 @ 3.2 GHz", cls: "boot-ok", delay: 300 },
    { text: "POST: Power-on self-test initiated", cls: "boot-info", delay: 400 },
    { text: "RAM: 16 KB cache OK", cls: "boot-ok", delay: 500 },
    { text: "CLK: System clock 100 MHz — stable", cls: "boot-ok", delay: 600 },
    { text: "UART: Channel 0 initialized at 115200 baud", cls: "boot-ok", delay: 700 },
    { text: "GPIO: Port mapping loaded", cls: "boot-info", delay: 500 },
    { text: "I2C: Bus scan — 2 device(s) found", cls: "boot-ok", delay: 600 },
    { text: "PWM: Timer configured (50 Hz base)", cls: "boot-info", delay: 500 },
    { text: "SENSOR: VL53L1X ToF — range 30–4000 mm", cls: "boot-ok", delay: 700 },
    { text: "SENSOR: LiDAR — scanning environment...", cls: "boot-warn", delay: 900 },
    { text: "SENSOR: IMU — calibration complete", cls: "boot-ok", delay: 600 },
    { text: "NET: Protocol stack ready", cls: "boot-info", delay: 500 },
    { text: "DISPLAY: Framebuffer @ 1920×1080 — initialized", cls: "boot-ok", delay: 600 },
    { text: "STORAGE: NAND flash — 0 bad blocks", cls: "boot-ok", delay: 500 },
    { text: "SYS: Interrupt vector table loaded", cls: "boot-info", delay: 400 },
    { text: "SYS: Scheduling idle task...", cls: "boot-info", delay: 500 },
    { text: "OK — All systems nominal", cls: "boot-ok", delay: 600 },
  ];

  /* Safety timeout — dismiss boot screen after 12s no matter what */
  const safetyTimer = setTimeout(() => {
    screen.classList.add("boot-done");
    sessionStorage.setItem("bootDone", "true");
  }, 12000);

  let totalDelay = 0;
  messages.forEach((msg, i) => {
    totalDelay += msg.delay;
    setTimeout(() => {
      const p = document.createElement("p");
      p.className = msg.cls;
      p.textContent = `[${String(i+1).padStart(2,"0")}] ${msg.text}`;
      output.appendChild(p);
      output.scrollTop = output.scrollHeight;
      progress.style.width = `${((i + 1) / messages.length) * 100}%`;
      status.textContent = msg.text;
      if (i === messages.length - 1) {
        setTimeout(() => {
          status.textContent = "System Ready";
          progress.style.width = "100%";
          setTimeout(() => {
            clearTimeout(safetyTimer);
            screen.classList.add("boot-done");
            sessionStorage.setItem("bootDone", "true");
          }, 500);
        }, 400);
      }
    }, totalDelay);
  });
})();

/* Reset body opacity in case bfcache restored a stale state */
document.body.style.opacity = "1";

/* Phase 4: Frequency Counter Clock */
(function initFreqClock() {
  const el = document.getElementById("freqClock");
  const timeEl = el?.querySelector(".freq-time");
  if (!timeEl) return;
  function tick() {
    const d = new Date();
    timeEl.textContent = d.toTimeString().slice(0, 8);
  }
  tick();
  setInterval(tick, 1000);
})();

const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const year = document.getElementById("year");
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll('.nav a[href^="#"], .nav a[href^="index.html#"]');
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxImages = document.querySelectorAll(".lightbox-image, .gallery-card img");
const ambientVoltage = document.getElementById("ambientVoltage");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("show");
  });

  document.querySelectorAll(".mobile-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("show");
    });
  });
}

if (year) {
  year.textContent = new Date().getFullYear();
}

function normalizeHref(href) {
  if (!href) return "";
  return href.includes("#") ? href.slice(href.indexOf("#")) : href;
}

function setActiveNavLink() {
  if (!sections.length) return;

  let currentSection = "";
  const scrollPosition = window.scrollY + window.innerHeight * 0.35;
  const pageBottom = window.scrollY + window.innerHeight;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionBottom = sectionTop + section.offsetHeight;

    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
      currentSection = section.getAttribute("id");
    }
  });

  if (pageBottom >= document.documentElement.scrollHeight - 10) {
    currentSection = sections[sections.length - 1].getAttribute("id");
  }

  navLinks.forEach((link) => {
    link.classList.remove("active-link");
    if (normalizeHref(link.getAttribute("href")) === `#${currentSection}`) {
      link.classList.add("active-link");
    }
  });
}

window.addEventListener("scroll", setActiveNavLink, { passive: true });
window.addEventListener("load", setActiveNavLink);

/* =========================
   MINI GAME BOY INTERACTIVES
   ========================= */
function startMiniSnake(canvas) {
  const ctx = canvas.getContext("2d");
  const COLS = 10, ROWS = 8;
  const cellW = canvas.width / COLS, cellH = canvas.height / ROWS;
  let snake = [{x:3,y:4},{x:2,y:4},{x:1,y:4}];
  let food = {x:7,y:4};
  let dir = {x:1,y:0};
  let nextDir = {x:1,y:0};
  let stepTimer = 0;
  const STEP_MS = 400;
  let id;
  function placeFood() {
    let fx, fy;
    do {
      fx = Math.floor(Math.random() * COLS);
      fy = Math.floor(Math.random() * ROWS);
    } while (snake.some(s => s.x === fx && s.y === fy));
    food = {x:fx, y:fy};
  }
  function tick() {
    dir = {...nextDir};
    const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
    if (head.x < 0) head.x = COLS - 1;
    if (head.x >= COLS) head.x = 0;
    if (head.y < 0) head.y = ROWS - 1;
    if (head.y >= ROWS) head.y = 0;
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      snake = [{x:3,y:4},{x:2,y:4},{x:1,y:4}];
      dir = {x:1,y:0};
      nextDir = {x:1,y:0};
      placeFood();
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      placeFood();
    } else {
      snake.pop();
    }
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x*cellW,0); ctx.lineTo(x*cellW,canvas.height); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0,y*cellH); ctx.lineTo(canvas.width,y*cellH); ctx.stroke(); }
    snake.forEach((s,i) => {
      ctx.fillStyle = i === 0 ? "#4ade80" : "#22c55e";
      const pad = 2;
      ctx.beginPath(); ctx.roundRect(s.x*cellW+pad, s.y*cellH+pad, cellW-pad*2, cellH-pad*2, 3); ctx.fill();
    });
    ctx.fillStyle = "#ef4444";
    ctx.beginPath(); ctx.arc(food.x*cellW+cellW/2, food.y*cellH+cellH/2, 5, 0, Math.PI*2); ctx.fill();
  }
  function loop(ts) {
    if (canvas._animCtrl?.paused) { id = requestAnimationFrame(loop); return; }
    if (!stepTimer) stepTimer = ts;
    if (ts - stepTimer >= STEP_MS) { stepTimer = ts; tick(); }
    draw();
    id = requestAnimationFrame(loop);
  }
  id = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(id);
}

function startMini7Seg(canvas) {
  const ctx = canvas.getContext("2d");
  let digit = 0;
  let lastFlip = 0;
  const FLIP_MS = 2000;
  const SEG_PATTERNS = [
    [1,1,1,1,1,1,0], [0,1,1,0,0,0,0], [1,1,0,1,1,0,1], [1,1,1,1,0,0,1],
    [0,1,1,0,0,1,1], [1,0,1,1,0,1,1], [1,0,1,1,1,1,1], [1,1,1,0,0,0,0],
    [1,1,1,1,1,1,1], [1,1,1,1,0,1,1],
  ];
  const SEG = [
    {x:0.3,y:0.15,w:0.4,h:0.06},{x:0.72,y:0.22,w:0.06,h:0.3},
    {x:0.72,y:0.52,w:0.06,h:0.3},{x:0.3,y:0.8,w:0.4,h:0.06},
    {x:0.22,y:0.52,w:0.06,h:0.3},{x:0.22,y:0.22,w:0.06,h:0.3},
    {x:0.3,y:0.46,w:0.4,h:0.06},
  ];
  const wireColor = canvas.dataset.wire || "#4488ff";
  let id;
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    const pat = SEG_PATTERNS[digit];
    ctx.lineCap = "round";
    SEG.forEach((s,i) => {
      ctx.fillStyle = pat[i] ? wireColor : "rgba(0,0,0,0.06)";
      ctx.shadowColor = pat[i] ? wireColor : "transparent";
      ctx.shadowBlur = pat[i] ? 8 : 0;
      ctx.beginPath();
      ctx.roundRect(s.x*canvas.width, s.y*canvas.height, s.w*canvas.width, s.h*canvas.height, 3);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.fillStyle = wireColor;
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(digit.toString(16).toUpperCase(), canvas.width/2, canvas.height*0.72);
  }
  function loop(ts) {
    if (canvas._animCtrl?.paused) { id = requestAnimationFrame(loop); return; }
    if (!lastFlip) lastFlip = ts;
    if (ts - lastFlip >= FLIP_MS) { lastFlip = ts; digit = (digit + 1) % 10; }
    draw();
    id = requestAnimationFrame(loop);
  }
  id = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(id);
}

function startMiniLidar(canvas) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const CX = 50, CY = H / 2;
  const RAY_LEN = 300;
  const obstacles = [
    {x:110,y:15,w:50,h:25},{x:145,y:100,w:55,h:18},{x:220,y:50,w:16,h:70},{x:160,y:155,w:70,h:16}
  ];
  let scanPoints = [];
  let angle = -80;
  let dir = 1;
  let id;
  function rayAABB(ox, oy, dx, dy, rect) {
    const t1 = (rect.x - ox) / dx, t2 = (rect.x + rect.w - ox) / dx;
    const t3 = (rect.y - oy) / dy, t4 = (rect.y + rect.h - oy) / dy;
    const tmin = Math.max(Math.min(t1,t2), Math.min(t3,t4));
    const tmax = Math.min(Math.max(t1,t2), Math.max(t3,t4));
    if (tmax < 0 || tmin > tmax) return null;
    const t = tmin < 0 ? tmax : tmin;
    return t > 0.5 ? t : null;
  }
  function castRay(ang) {
    const rad = ang * Math.PI / 180;
    const dx = Math.cos(rad), dy = Math.sin(rad);
    let minD = RAY_LEN;
    for (const o of obstacles) {
      const t = rayAABB(CX, CY, dx, dy, o);
      if (t !== null && t < minD) minD = t;
    }
    return minD;
  }
  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0,0,W,H);
    obstacles.forEach(o => {
      ctx.fillStyle = "rgba(46,213,115,0.06)";
      ctx.strokeStyle = "rgba(46,213,115,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.rect(o.x, o.y, o.w, o.h); ctx.fill(); ctx.stroke();
    });
    scanPoints.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI*2);
      ctx.fillStyle = "rgba(46,213,115,0.4)";
      ctx.fill();
    });
    const dist = castRay(angle);
    const rad = angle * Math.PI / 180;
    const ex = CX + Math.cos(rad) * dist;
    const ey = CY + Math.sin(rad) * dist;
    ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(ex, ey);
    ctx.strokeStyle = "rgba(46,213,115,0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath(); ctx.arc(ex, ey, 2.5, 0, Math.PI*2);
    ctx.fillStyle = "#2ed573";
    ctx.fill();
    ctx.beginPath(); ctx.arc(CX, CY, 4, 0, Math.PI*2);
    ctx.fillStyle = "#8a6cff";
    ctx.fill();
    ctx.fillStyle = "rgba(46,213,115,0.4)";
    ctx.font = "7px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("LiDAR SCAN  ±80°", 6, H - 4);
  }
  function loop() {
    if (canvas._animCtrl?.paused) { id = requestAnimationFrame(loop); return; }
    angle += 1.2 * dir;
    if (angle > 80) { dir = -1; angle = 80; scanPoints = []; }
    if (angle < -80) { dir = 1; angle = -80; scanPoints = []; }
    const rad = angle * Math.PI / 180;
    const dist = castRay(angle);
    const ex = CX + Math.cos(rad) * dist;
    const ey = CY + Math.sin(rad) * dist;
    scanPoints.push({x:ex, y:ey});
    draw();
    id = requestAnimationFrame(loop);
  }
  id = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(id);
}

function startMiniCar(canvas) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const COLS = 14, ROWS = 10;
  const CW = W / COLS, CH = H / ROWS;
  const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,1,0,1],
    [1,1,1,1,0,1,1,1,1,1,0,0,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,0,0,1,0,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ];
  const END_X = 12, END_Y = 8;
  let car = {x:1, y:1, dir:0};
  let path = [{x:1,y:1}];
  let failCount = 0;
  let id;
  const DX = [1,0,-1,0], DY = [0,1,0,-1];
  function step() {
    if (car.x === END_X && car.y === END_Y) {
      path = [{x:1,y:1}]; car.x=1; car.y=1; car.dir=0; failCount=0;
      return;
    }
    for (let turn of [1,0,-1,2]) {
      const nd = (car.dir + turn + 4) % 4;
      const nx = car.x + DX[nd], ny = car.y + DY[nd];
      if (ny<0||ny>=ROWS||nx<0||nx>=COLS||maze[ny][nx]===1) continue;
      const recent = path.slice(-3).filter(p => p.x===nx && p.y===ny).length;
      if (turn===0 && recent>1) continue;
      if (turn!==0 && recent>0 && Math.random()<0.3) continue;
      car.x=nx; car.y=ny; car.dir=nd;
      path.push({x:nx,y:ny});
      if (path.length>80) path.shift();
      failCount=0; return;
    }
    failCount++;
    if (failCount>5) { car.x=1; car.y=1; car.dir=0; path=[{x:1,y:1}]; failCount=0; }
  }
  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#fafafa"; ctx.fillRect(0,0,W,H);
    for (let r=0; r<ROWS; r++) for (let c=0; c<COLS; c++) {
      if (maze[r][c]===1) {
        ctx.fillStyle="rgba(255,165,2,0.06)";
        ctx.strokeStyle="rgba(255,165,2,0.2)";
        ctx.lineWidth=0.8;
        ctx.beginPath(); ctx.rect(c*CW, r*CH, CW+0.5, CH+0.5); ctx.fill(); ctx.stroke();
      }
    }
    for (let i=0; i<path.length; i++) {
      ctx.fillStyle=i===path.length-1 ? "rgba(255,165,2,0.4)" : "rgba(255,165,2,0.05)";
      ctx.beginPath(); ctx.arc(path[i].x*CW+CW/2, path[i].y*CH+CH/2, 2.5, 0, Math.PI*2); ctx.fill();
    }
    const cx=car.x*CW+CW/2, cy=car.y*CH+CH/2;
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(car.dir*Math.PI/2);
    ctx.fillStyle="#ffa502";
    ctx.beginPath(); ctx.moveTo(9,0); ctx.lineTo(-6,-6); ctx.lineTo(-4,0); ctx.lineTo(-6,6); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle="rgba(255,165,2,0.4)"; ctx.strokeStyle="#ffa502"; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.arc(END_X*CW+CW/2, END_Y*CH+CH/2, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle="rgba(255,165,2,0.5)"; ctx.font="6px monospace"; ctx.textAlign="left"; ctx.textBaseline="bottom";
    ctx.fillText("MAZE NAV  ⚡", 6, H-4);
  }
  let tick=0;
  function loop() {
    if (canvas._animCtrl?.paused) { id = requestAnimationFrame(loop); return; }
    tick++; if (tick%10===0) step();
    draw();
    id=requestAnimationFrame(loop);
  }
  id=requestAnimationFrame(loop);
  return ()=>cancelAnimationFrame(id);
}

function startMiniCPU(canvas) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  // Core layout: 2x2 grid
  const cw = 55, ch = 40, gap = 10;
  const ox = (W - cw * 2 - gap) / 2, oy = 10;
  const cores = [
    { x: ox, y: oy },
    { x: ox + cw + gap, y: oy },
    { x: ox, y: oy + ch + gap },
    { x: ox + cw + gap, y: oy + ch + gap },
  ];
  const centers = cores.map(c => ({ x: c.x + cw / 2, y: c.y + ch / 2 }));

  // State
  let load = [15, 42, 73, 28];
  let targetLoad = [15, 42, 73, 28];
  let threads = [];
  let spawnTimer = 30;
  let temp = 42;
  let fan = 0;
  let clockMHz = 5200;
  let id;

  function update() {
    if (canvas._animCtrl?.paused) return;

    // Per-core load random walk
    for (let i = 0; i < 4; i++) {
      targetLoad[i] += (Math.random() - 0.5) * 26;
      targetLoad[i] = Math.max(0, Math.min(100, targetLoad[i]));
      load[i] += (targetLoad[i] - load[i]) * 0.06;
    }

    const avgLoad = load.reduce((a, b) => a + b, 0) / 4;

    // Thermal dynamics: heat from load, cooling from fan
    const heatGen = avgLoad * 0.55;
    const fanCool = fan * 0.1;
    temp += (38 + heatGen - temp - fanCool) * 0.035;
    temp += (Math.random() - 0.5) * 0.2;
    temp = Math.max(36, Math.min(90, temp));

    // Fan controller: ramps up as temp rises past 48°C
    const targetFan = Math.max(0, Math.min(100, (temp - 48) * 3.5));
    fan += (targetFan - fan) * 0.05;

    // Clock throttling: drops from 5.2 GHz when temp > 72°C
    clockMHz += ((temp > 72 ? 3200 : 5200) - clockMHz) * 0.04;

    // Spawn a thread (process) on a random core, migrating to another
    spawnTimer--;
    if (spawnTimer <= 0) {
      const src = Math.floor(Math.random() * 4);
      let dst = (src + 1 + Math.floor(Math.random() * 3)) % 4;
      threads.push({
        src, dst,
        t: 0,
        speed: 0.015 + Math.random() * 0.025,
      });
      spawnTimer = 25 + Math.floor(Math.random() * 55);
    }

    // Advance thread particles
    for (let i = threads.length - 1; i >= 0; i--) {
      threads[i].t += threads[i].speed;
      if (threads[i].t >= 1) threads.splice(i, 1);
    }
    if (threads.length > 15) threads.splice(0, threads.length - 15);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, W, H);

    // Outer chip border
    ctx.strokeStyle = "rgba(0,0,0,0.05)";
    ctx.lineWidth = 1;
    ctx.strokeRect(2, 2, W - 4, H - 4);

    // ── Bus lines between cores ──
    ctx.strokeStyle = "rgba(255,135,178,0.12)";
    ctx.lineWidth = 1;

    // Horizontal buses (row 0 → row 1 via center)
    const h1y = cores[0].y + ch / 2;
    ctx.beginPath(); ctx.moveTo(cores[0].x + cw, h1y); ctx.lineTo(cores[1].x, h1y); ctx.stroke();
    const h2y = cores[2].y + ch / 2;
    ctx.beginPath(); ctx.moveTo(cores[2].x + cw, h2y); ctx.lineTo(cores[3].x, h2y); ctx.stroke();

    // Vertical buses (col 0 → col 1)
    const v1x = cores[0].x + cw / 2;
    ctx.beginPath(); ctx.moveTo(v1x, cores[0].y + ch); ctx.lineTo(v1x, cores[2].y); ctx.stroke();
    const v2x = cores[1].x + cw / 2;
    ctx.beginPath(); ctx.moveTo(v2x, cores[1].y + ch); ctx.lineTo(v2x, cores[3].y); ctx.stroke();

    // Diagonal cross-links for inter-core traffic
    ctx.strokeStyle = "rgba(255,135,178,0.06)";
    ctx.beginPath(); ctx.moveTo(cores[0].x + cw, h1y); ctx.lineTo(v1x, cores[2].y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cores[1].x, h1y); ctx.lineTo(v2x, cores[3].y); ctx.stroke();

    // ── Thread particles ──
    for (const th of threads) {
      const s = centers[th.src], d = centers[th.dst];
      const t = th.t;
      const mx = (s.x + d.x) / 2;
      const my = (s.y + d.y) / 2 - 8;
      const px = (1 - t) * (1 - t) * s.x + 2 * (1 - t) * t * mx + t * t * d.x;
      const py = (1 - t) * (1 - t) * s.y + 2 * (1 - t) * t * my + t * t * d.y;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ff87b2";
      ctx.shadowColor = "#ff87b2";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // ── Draw cores ──
    for (let i = 0; i < 4; i++) {
      const c = cores[i], l = load[i];
      const hue = 120 - l * 1.2;
      const col = `hsl(${Math.round(Math.max(hue, 0))}, 65%, 60%)`;

      ctx.fillStyle = "#f0f0f5";
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(c.x, c.y, cw, ch, 5);
      ctx.fill();
      ctx.stroke();

      // Per-core utilization bar (bottom of core)
      const bh = 5, bp = 4;
      const bw = cw - bp * 2;
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.beginPath();
      ctx.roundRect(c.x + bp, c.y + ch - bh - bp, bw, bh, 2);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(c.x + bp, c.y + ch - bh - bp, bw * (l / 100), bh, 2);
      ctx.fill();

      // Core number
      ctx.fillStyle = "#6b5bcf";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`C${i}`, c.x + cw / 2, c.y + 14);

      // Load percentage
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.font = "8px monospace";
      ctx.fillText(`${Math.round(l)}%`, c.x + cw / 2, c.y + ch - 14);
    }

    // ── Bottom status panel ──
    const by = 150, bh2 = 42;
    ctx.fillStyle = "rgba(0,0,0,0.04)";
    ctx.beginPath();
    ctx.roundRect(4, by, W - 8, bh2, 6);
    ctx.fill();

    const rowY = by + 8;
    const cols = [
      { x: 12, label: "CLOCK", value: (clockMHz / 1000).toFixed(2) + " GHz", color: clockMHz < 4000 ? "#ef4444" : "#22c55e" },
      { x: 105, label: "TEMP", value: Math.round(temp) + "\u00B0C", color: temp > 75 ? "#ef4444" : temp > 60 ? "#f59e0b" : "#22c55e" },
      { x: 200, label: "FAN", value: Math.round(800 + fan * 38) + " RPM", color: fan > 70 ? "#f59e0b" : "#4488ff" },
    ];

    cols.forEach(col => {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.font = "bold 7px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(col.label, col.x, rowY);

      ctx.fillStyle = col.color;
      ctx.font = "bold 10px monospace";
      ctx.fillText(col.value, col.x, rowY + 14);
    });

    // Temperature micro-bar
    const tbX = 153, tbY = rowY + 20, tbW = 44, tbH = 4;
    const tCol = temp > 75 ? "#ef4444" : temp > 60 ? "#f59e0b" : "#22c55e";
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.beginPath(); ctx.roundRect(tbX, tbY, tbW, tbH, 2); ctx.fill();
    const tf = (temp - 35) / 55;
    ctx.fillStyle = tCol;
    ctx.beginPath(); ctx.roundRect(tbX, tbY, tbW * Math.max(0, Math.min(tf, 1)), tbH, 2); ctx.fill();

    // Fan micro-bar
    const fbX = 248, fbY = rowY + 20, fbW = 28;
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.beginPath(); ctx.roundRect(fbX, fbY, fbW, tbH, 2); ctx.fill();
    ctx.fillStyle = "#4488ff";
    ctx.beginPath(); ctx.roundRect(fbX, fbY, fbW * (fan / 100), tbH, 2); ctx.fill();
  }

  function loop() {
    update();
    draw();
    id = requestAnimationFrame(loop);
  }

  id = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(id);
}

function startMiniInteractive(canvas) {
  const type = canvas.dataset.interactive;
  const starters = { snake: startMiniSnake, "7seg": startMini7Seg, lidar: startMiniLidar, car: startMiniCar, cpu: startMiniCPU };
  const fn = starters[type];
  if (!fn) return null;

  const ctrl = { paused: false };
  canvas._animCtrl = ctrl;
  const cleanup = fn(canvas);
  ctrl.pause = () => { ctrl.paused = true; };
  ctrl.resume = () => { ctrl.paused = false; };
  ctrl.destroy = () => { if (cleanup) cleanup(); };

  return ctrl;
}

/* Phase 5: Circuit Wiring Puzzle */
(function initCircuitPuzzle() {
  const board = document.getElementById("cpBoard");
  const svg = document.getElementById("cpSvg");
  const rightCol = document.getElementById("cpRightCol");
  const track = document.getElementById("cpCarouselTrack");
  const prevBtn = document.getElementById("cpCarouselPrev");
  const nextBtn = document.getElementById("cpCarouselNext");
  const countEl = document.getElementById("cpCount");
  const fillEl = document.getElementById("cpFill");
  if (!board || !rightCol) return;

  const canvasObserver = typeof IntersectionObserver !== "undefined"
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const ctrl = entry.target._animCtrl;
          if (!ctrl) return;
          entry.isIntersecting ? ctrl.resume() : ctrl.pause();
        });
      }, { threshold: 0 })
    : null;

  const COLORS = [
    { name: "RED", hex: "#ff4757" },
    { name: "BLUE", hex: "#4488ff" },
    { name: "GREEN", hex: "#2ed573" },
    { name: "YELLOW", hex: "#ffa502" },
    { name: "PINK", hex: "#ff87b2" },
  ];

  const PROJECTS = [
    { id: "2sh4", title: "C++ OOD Snake Game", code: "2SH4", image: "images/2sh4_code.png", tags: "C++ · OOD · FSM · Game Logic", wire: "#ff4757", interactive: "snake" },
    { id: "2di4", title: "Digital Logic Design", code: "2DI4", image: "images/2di4-cover.png", tags: "Logic · HDL · Circuits · Verification", wire: "#4488ff", interactive: "7seg" },
    { id: "2dx3", title: "Indoor Mapping Embedded System", code: "2DX3", image: "images/2dx3-cover.jpg", tags: "Embedded · MSP432 · ToF Sensor · MATLAB", wire: "#2ed573", interactive: "lidar" },
    { id: "3ey4", title: "Electrical Systems Integration", code: "3EY4", image: "images/3ey4-cover.png", tags: "ROS · Linux · LiDAR · Controls · AEV", wire: "#ffa502", interactive: "car" },
    { id: "pc-build", title: "Custom PC Build", code: "PC", image: "images/pc-cover.png", tags: "Hardware · Troubleshooting · Thermals", wire: "#ff87b2", interactive: "cpu" },
  ];

  let isDragging = false;
  let dragStartNode = null;
  let tempLine = null;
  let matched = 0;
  let wires = [];

  function getBoardPos(cx, cy) {
    const r = board.getBoundingClientRect();
    return { x: cx - r.left, y: cy - r.top };
  }

  function makeTempLine(from) {
    const p = getDotCenter(from);
    const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
    el.setAttribute("fill", "none");
    el.setAttribute("stroke", "rgba(255,135,178,0.4)");
    el.setAttribute("stroke-width", "3");
    el.setAttribute("stroke-dasharray", "5,5");
    el.setAttribute("stroke-linecap", "round");
    el.setAttribute("d", `M${p.x},${p.y} L${p.x},${p.y}`);
    svg.appendChild(el);
    return el;
  }

  function updateTempLine(line, from, to) {
    const p1 = getDotCenter(from);
    const dx = to.x - p1.x;
    line.setAttribute("d", `M${p1.x},${p1.y} C${p1.x + dx * 0.4},${p1.y} ${to.x - dx * 0.4},${to.y} ${to.x},${to.y}`);
  }

  function removeTempLine() {
    if (tempLine) { tempLine.remove(); tempLine = null; }
  }

  const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
  shuffled.forEach((c, i) => {
    const node = document.createElement("div");
    node.className = "cp-node";
    node.dataset.color = c.name.toLowerCase();
    node.dataset.idx = i;
    node.innerHTML =
      `<span class="cp-dot" style="background:${c.hex};box-shadow:0 0 8px ${c.hex}80"></span>` +
      `<span class="cp-node-label">${c.name}</span>`;
    rightCol.appendChild(node);
  });

  function getDotCenter(el) {
    const dot = el.querySelector(".cp-dot");
    const br = board.getBoundingClientRect();
    const dr = dot.getBoundingClientRect();
    return { x: dr.left + dr.width / 2 - br.left, y: dr.top + dr.height / 2 - br.top };
  }

  function drawWire(leftEl, rightEl, color) {
    const p1 = getDotCenter(leftEl);
    const p2 = getDotCenter(rightEl);
    const dx = p2.x - p1.x;
    const d = `M${p1.x},${p1.y} C${p1.x + dx * 0.4},${p1.y} ${p2.x - dx * 0.4},${p2.y} ${p2.x},${p2.y}`;

    // Insulation jacket (thick, translucent)
    const jacket = document.createElementNS("http://www.w3.org/2000/svg", "path");
    jacket.setAttribute("d", d);
    jacket.setAttribute("fill", "none");
    jacket.setAttribute("stroke", color);
    jacket.setAttribute("stroke-width", "24");
    jacket.setAttribute("stroke-linecap", "round");
    jacket.setAttribute("opacity", "0");
    svg.appendChild(jacket);

    // Conductor core (thin, bright)
    const core = document.createElementNS("http://www.w3.org/2000/svg", "path");
    core.setAttribute("d", d);
    core.setAttribute("fill", "none");
    core.setAttribute("stroke", color);
    core.setAttribute("stroke-width", "8");
    core.setAttribute("stroke-linecap", "round");
    core.setAttribute("opacity", "0");
    svg.appendChild(core);

    // Fade in both layers
    requestAnimationFrame(() => {
      jacket.setAttribute("opacity", "0.2");
      core.setAttribute("opacity", "1");
    });
    wires.push(jacket, core);

    // Frayed strand ends at both endpoints
    [p1, p2].forEach((pt, i) => {
      const fanAngle = i === 0 ? Math.PI : 0; // p1 fans left, p2 fans right
      const spread = 130 * Math.PI / 180;
      const count = 5 + Math.floor(Math.random() * 2);

      // Tiny anchor dot
      const anchor = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      anchor.setAttribute("cx", pt.x);
      anchor.setAttribute("cy", pt.y);
      anchor.setAttribute("r", "2");
      anchor.setAttribute("fill", color);
      anchor.setAttribute("opacity", "0");
      svg.appendChild(anchor);
      requestAnimationFrame(() => anchor.setAttribute("opacity", "0.9"));
      wires.push(anchor);

      for (let s = 0; s < count; s++) {
        const a = fanAngle - spread / 2 + (spread / (count - 1)) * s + (Math.random() - 0.5) * 0.3;
        const len = 4 + Math.random() * 6;
        const endX = pt.x + Math.cos(a) * len;
        const endY = pt.y + Math.sin(a) * len;
        const midX = pt.x + Math.cos(a + (Math.random() - 0.5) * 0.3) * len * 0.6;
        const midY = pt.y + Math.sin(a + (Math.random() - 0.5) * 0.3) * len * 0.6;

        const strand = document.createElementNS("http://www.w3.org/2000/svg", "path");
        strand.setAttribute("d", `M${pt.x},${pt.y} Q${midX},${midY} ${endX},${endY}`);
        strand.setAttribute("fill", "none");
        strand.setAttribute("stroke", color);
        strand.setAttribute("stroke-width", (2 + Math.random() * 1.5).toFixed(1).toString());
        strand.setAttribute("stroke-linecap", "round");
        strand.setAttribute("opacity", "0");
        svg.appendChild(strand);
        requestAnimationFrame(() => strand.setAttribute("opacity", "0.8"));
        wires.push(strand);
      }
    });
  }

  function showProject(idx) {
    const p = PROJECTS[idx];
    const card = document.createElement("a");
    card.className = "gb-card";
    card.href = `${p.id}.html`;
    card.style.setProperty("--order", matched);
    card.style.setProperty("--wire", p.wire);
    card.innerHTML =
      `<div class="gb-screen">` +
        `<canvas class="gb-canvas" width="280" height="196" data-interactive="${p.interactive}" data-wire="${p.wire}"></canvas>` +
      `</div>` +
      `<div class="gb-body">` +
        `<span class="gb-title">${p.title}</span>` +
        `<span class="gb-code">${p.code}</span>` +
        `<span class="gb-tags">${p.tags}</span>` +
        `<div class="gb-controls">` +
          `<div class="gb-dpad">` +
            `<span class="gb-cross-arm gb-cross-arm-top"></span>` +
            `<span class="gb-cross-arm gb-cross-arm-right"></span>` +
            `<span class="gb-cross-arm gb-cross-arm-bottom"></span>` +
            `<span class="gb-cross-arm gb-cross-arm-left"></span>` +
            `<span class="gb-cross-center"></span>` +
          `</div>` +
          `<div class="gbb-buttons">` +
            `<span class="gbb gbb-b">B</span>` +
            `<span class="gbb gbb-a">A</span>` +
          `</div>` +
        `</div>` +
        `<div class="gb-select-row">` +
          `<span class="gb-pill">SELECT</span>` +
          `<span class="gb-pill">START</span>` +
          `<span class="gb-view">VIEW →</span>` +
        `</div>` +
      `</div>`;
    track.appendChild(card);
    const canvas = card.querySelector("canvas");
    startMiniInteractive(canvas);
    if (canvasObserver) canvasObserver.observe(canvas);
    // Auto-scroll to show the newly revealed card
    requestAnimationFrame(() => {
      card.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
      updateArrows();
    });
  }

  function updateProgress() {
    countEl.textContent = matched;
    fillEl.style.width = `${(matched / COLORS.length) * 100}%`;
  }

  function checkComplete() {
    if (matched === COLORS.length) {
      const div = document.createElement("div");
      div.className = "cp-celebrate";
      div.innerHTML = '<span class="cp-celebrate-text">⚡ All circuits restored!</span>';
      board.after(div);
    }
  }

  function updateArrows() {
    if (!track) return;
    const atStart = track.scrollLeft <= 4;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    if (prevBtn) prevBtn.disabled = atStart;
    if (nextBtn) nextBtn.disabled = atEnd;
  }

  /* ─── Carousel arrows ─── */
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      const child = track.querySelector(".gb-card");
      if (!child) return;
      const w = child.offsetWidth + 16;
      track.scrollBy({ left: -w, behavior: "smooth" });
      setTimeout(updateArrows, 350);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const child = track.querySelector(".gb-card");
      if (!child) return;
      const w = child.offsetWidth + 16;
      track.scrollBy({ left: w, behavior: "smooth" });
      setTimeout(updateArrows, 350);
    });
  }
  if (track) {
    track.addEventListener("scroll", updateArrows);
  }

  /* ─── Drag: left node mousedown ─── */
  document.querySelectorAll(".cp-left-col .cp-node").forEach(node => {
    node.addEventListener("mousedown", e => {
      if (node.classList.contains("cp-matched")) return;
      e.preventDefault();
      document.querySelectorAll(".cp-node.cp-selected").forEach(n => n.classList.remove("cp-selected"));
      node.classList.add("cp-selected");
      isDragging = true;
      dragStartNode = node;
      tempLine = makeTempLine(node);
      document.body.classList.add("cp-dragging");
    });
  });

  /* ─── Mousemove on document ─── */
  document.addEventListener("mousemove", e => {
    if (!isDragging || !tempLine || !dragStartNode) return;
    updateTempLine(tempLine, dragStartNode, getBoardPos(e.clientX, e.clientY));
  });

  /* ─── Mouseup on document ─── */
  document.addEventListener("mouseup", e => {
    if (!isDragging) return;
    isDragging = false;
    document.body.classList.remove("cp-dragging");
    removeTempLine();
    const src = dragStartNode;
    dragStartNode = null;
    if (!src) return;

    const t = document.elementFromPoint(e.clientX, e.clientY);
    const node = t?.closest(".cp-right-col .cp-node");
    if (node && !node.classList.contains("cp-matched") && src.dataset.color === node.dataset.color) {
      src.classList.remove("cp-selected");
      src.classList.add("cp-matched");
      node.classList.add("cp-matched");
      drawWire(src, node, COLORS.find(c => c.name.toLowerCase() === src.dataset.color).hex);
      matched++;
      updateProgress();
      showProject(parseInt(src.dataset.proj));
      checkComplete();
    } else {
      if (node && !node.classList.contains("cp-matched") && src.dataset.color !== node.dataset.color) {
        node.classList.add("cp-shake");
        src.classList.add("cp-shake");
        setTimeout(() => {
          node.classList.remove("cp-shake");
          src.classList.remove("cp-shake");
          src.classList.remove("cp-selected");
        }, 350);
      } else {
        src.classList.remove("cp-selected");
      }
    }
  });

  /* ─── Touch: left node touchstart ─── */
  document.querySelectorAll(".cp-left-col .cp-node").forEach(node => {
    node.addEventListener("touchstart", e => {
      if (node.classList.contains("cp-matched")) return;
      const t = e.touches[0];
      document.querySelectorAll(".cp-node.cp-selected").forEach(n => n.classList.remove("cp-selected"));
      node.classList.add("cp-selected");
      isDragging = true;
      dragStartNode = node;
      tempLine = makeTempLine(node);
      document.body.classList.add("cp-dragging");
    }, { passive: true });
  });

  /* ─── Touchmove on document ─── */
  document.addEventListener("touchmove", e => {
    if (!isDragging || !tempLine || !dragStartNode) return;
    const t = e.touches[0];
    updateTempLine(tempLine, dragStartNode, getBoardPos(t.clientX, t.clientY));
  }, { passive: true });

  /* ─── Touchend on document ─── */
  document.addEventListener("touchend", e => {
    if (!isDragging) return;
    isDragging = false;
    document.body.classList.remove("cp-dragging");
    removeTempLine();
    const src = dragStartNode;
    dragStartNode = null;
    if (!src) return;

    const t = e.changedTouches[0];
    const hit = document.elementFromPoint(t.clientX, t.clientY);
    const node = hit?.closest(".cp-right-col .cp-node");
    if (node && !node.classList.contains("cp-matched") && src.dataset.color === node.dataset.color) {
      src.classList.remove("cp-selected");
      src.classList.add("cp-matched");
      node.classList.add("cp-matched");
      drawWire(src, node, COLORS.find(c => c.name.toLowerCase() === src.dataset.color).hex);
      matched++;
      updateProgress();
      showProject(parseInt(src.dataset.proj));
      checkComplete();
    } else {
      if (node && !node.classList.contains("cp-matched") && src.dataset.color !== node.dataset.color) {
        node.classList.add("cp-shake");
        src.classList.add("cp-shake");
        setTimeout(() => {
          node.classList.remove("cp-shake");
          src.classList.remove("cp-shake");
          src.classList.remove("cp-selected");
        }, 350);
      } else {
        src.classList.remove("cp-selected");
      }
    }
  }, { passive: true });

  function resizeSvg() {
    const r = board.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
  }
  resizeSvg();
  window.addEventListener("resize", resizeSvg);
})();

const projectCards = document.querySelectorAll(".project-card");
projectCards.forEach((card) => {
  const glow = document.createElement("span");
  glow.classList.add("card-glow");
  card.appendChild(glow);

  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    glow.style.left = `${e.clientX - rect.left}px`;
    glow.style.top = `${e.clientY - rect.top}px`;
  });
});

lightboxImages.forEach((img) => {
  img.classList.add("lightbox-image");
  img.addEventListener("click", () => {
    if (lightbox && lightboxImg) {
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || "Expanded project image";
      lightbox.classList.add("show");
    }
  });
});

if (lightboxClose) {
  lightboxClose.addEventListener("click", () => {
    lightbox.classList.remove("show");
  });
}

if (lightbox) {
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove("show");
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.classList.contains("show")) {
    lightbox.classList.remove("show");
  }
});

if (ambientVoltage && !prefersReducedMotion) {
  let voltageFrame;
  window.addEventListener("mousemove", (e) => {
    cancelAnimationFrame(voltageFrame);
    voltageFrame = requestAnimationFrame(() => {
      ambientVoltage.style.transform = `translate(${e.clientX - 160}px, ${e.clientY - 160}px)`;
    });
  });

  window.addEventListener("mouseleave", () => {
    ambientVoltage.style.opacity = "0";
  });

  window.addEventListener("mouseenter", () => {
    ambientVoltage.style.opacity = "0.7";
  });
}

function setupMagneticButtons() {
  if (prefersReducedMotion) return;

  document.querySelectorAll(".magnetic-btn").forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translate(0, 0)";
    });
  });
}

const revealTargets = document.querySelectorAll(
  ".glass-card, .overview-card, .case-card, .project-card, .contact-card, .stat-card, .gallery-card, .timeline-item, .project-panel, .profile-card, .hero-motherboard"
);

if (!prefersReducedMotion) {
  revealTargets.forEach((el) => el.classList.add("reveal-up"));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealTargets.forEach((el) => revealObserver.observe(el));
}

setupMagneticButtons();


function setupCircuitParallax() {
  if (prefersReducedMotion) return;

  const stickers = document.querySelectorAll(".schematic-sticker");
  if (!stickers.length) return;

  let frame;
  window.addEventListener("mousemove", (event) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const x = (event.clientX / window.innerWidth - 0.5);
      const y = (event.clientY / window.innerHeight - 0.5);

      stickers.forEach((sticker, index) => {
        const depth = (index % 4 + 1) * 4;
        sticker.style.setProperty("--px", `${x * depth}px`);
        sticker.style.setProperty("--py", `${y * depth}px`);
      });
    });
  });
}

setupCircuitParallax();


function setupInteractiveInlineChip() {
  if (prefersReducedMotion) return;

  document.querySelectorAll(".interactive-inline-chip").forEach((chip) => {
    let activeTimer;

    const activate = () => {
      chip.classList.add("is-active");
      clearTimeout(activeTimer);
      activeTimer = setTimeout(() => chip.classList.remove("is-active"), 900);
    };

    chip.addEventListener("mousemove", (event) => {
      const rect = chip.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      chip.style.setProperty("--mx", `${x}%`);
      chip.style.setProperty("--my", `${y}%`);
      activate();
    });

    chip.addEventListener("mouseenter", activate);
    chip.addEventListener("click", activate);
    chip.addEventListener("focus", activate);
    chip.addEventListener("mouseleave", () => chip.classList.remove("is-active"));
  });
}

setupInteractiveInlineChip();

/* Phase 11: Page transitions — use CSS @view-transition, avoid bfcache-breaking JS */
/* fallback removed: inline opacity changes cause frozen pages on browser back-nav */

/* Phase 12: Keyboard Shortcuts */
(function initKeyboardNav() {
  const sectionMap = {
    "h": "home", "c": "contact",
    "1": "#projects", "2": "#projects", "3": "#projects",
    "4": "#projects", "5": "#projects",
  };
  document.addEventListener("keydown", e => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    const key = e.key.toLowerCase();
    if (sectionMap[key]) {
      const el = document.getElementById(sectionMap[key]);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    if (key === "escape") {
      document.querySelectorAll(".lightbox.show, .mobile-menu.show").forEach(el => {
        el.classList.remove("show");
      });
    }
  });
})();

/* Phase 13: Ripple micro-interaction */
(function initRipples() {
  document.querySelectorAll(".btn, .filter-btn").forEach(btn => {
    btn.addEventListener("click", function(e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.style.position = "relative";
      this.style.overflow = "hidden";
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    });
  });
})();

/* Phase 8: Code Carousel + Highlight.js */
(function initCodeCarousel() {
  if (typeof hljs !== "undefined") {
    hljs.highlightAll();
  }

  document.querySelectorAll(".code-carousel").forEach(carousel => {
    const slides = carousel.querySelectorAll(".code-slide");
    const dots = carousel.querySelectorAll(".code-dot");
    if (!slides.length || !dots.length) return;
    let current = 0;
    let timer;

    function show(idx) {
      slides.forEach(s => s.classList.remove("active"));
      dots.forEach(d => d.classList.remove("active"));
      slides[idx].classList.add("active");
      dots[idx].classList.add("active");
      current = idx;
    }

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        show(i);
        clearInterval(timer);
        timer = setInterval(() => show((current + 1) % slides.length), 5000);
      });
    });

    timer = setInterval(() => show((current + 1) % slides.length), 5000);
  });
})();


