(function initSnakeGame() {
  const canvas2D = document.getElementById("snakeCanvas2D");
  const container3D = document.getElementById("snakeCanvas3D");
  if (!canvas2D) return;

  // ========== CLASSES MIRRORING C++ OOD ARCHITECTURE ==========

  class objPos {
    constructor(x, y, sym) {
      this.x = x; this.y = y; this.symbol = sym;
    }
    isPosEqual(other) {
      return this.x === other.x && this.y === other.y;
    }
    setObjPos(x, y, sym) {
      this.x = x; this.y = y; this.symbol = sym;
    }
  }

  class objPosArrayList {
    constructor() {
      this.capacity = 200;
      this.list = [];
    }
    getSize() { return this.list.length; }
    insertHead(p) {
      this.list.unshift(p);
      if (this.list.length > this.capacity) this.list.pop();
    }
    insertTail(p) {
      if (this.list.length < this.capacity) this.list.push(p);
    }
    removeHead() { if (this.list.length) this.list.shift(); }
    removeTail() { if (this.list.length) this.list.pop(); }
    getHeadElement() { return this.list[0] || new objPos(0,0,' '); }
    getTailElement() { return this.list[this.list.length - 1] || new objPos(0,0,' '); }
    getElement(i) { return (i >= 0 && i < this.list.length) ? this.list[i] : new objPos(0,0,' '); }
  }

  class GameMechs {
    constructor() {
      this.input = '';
      this.exitFlag = false;
      this.loseFlag = false;
      this.score = 0;
      this.speed = 100000;
      this.boardSizeX = 30;
      this.boardSizeY = 15;
    }
    getExitFlagStatus() { return this.exitFlag; }
    setExitTrue() { this.exitFlag = true; }
    getLoseFlagStatus() { return this.loseFlag; }
    setLoseFlag() { this.loseFlag = true; }
    getInput() { return this.input; }
    setInput(c) { this.input = c; }
    clearInput() { this.input = ''; }
    getSpeed() { return this.speed; }
    setSpeed(s) { if (s >= 10000 && s <= 100000) this.speed = s; }
    getBoardSizeX() { return this.boardSizeX; }
    getBoardSizeY() { return this.boardSizeY; }
    getScore() { return this.score; }
    incrementScore() { this.score++; }
  }

  class Player {
    constructor(gmRef) {
      this.Dir = { UP: 0, DOWN: 1, LEFT: 2, RIGHT: 3, STOP: 4 };
      this.myDir = this.Dir.STOP;
      this.mainGameMechsRef = gmRef;
      this.playerPosList = new objPosArrayList();
      const cx = Math.floor(gmRef.getBoardSizeX() / 2);
      const cy = Math.floor(gmRef.getBoardSizeY() / 2);
      this.playerPosList.insertHead(new objPos(cx, cy, '@'));
    }
    getPlayerPosListRef() { return this.playerPosList; }
    getHeadPos() { return this.playerPosList.getHeadElement(); }
    updatePlayerDir() {
      const input = this.mainGameMechsRef.getInput().toLowerCase();
      if (!input) return;
      switch (input) {
        case 'w': if (this.myDir !== this.Dir.DOWN) this.myDir = this.Dir.UP; break;
        case 'a': if (this.myDir !== this.Dir.RIGHT) this.myDir = this.Dir.LEFT; break;
        case 's': if (this.myDir !== this.Dir.UP) this.myDir = this.Dir.DOWN; break;
        case 'd': if (this.myDir !== this.Dir.LEFT) this.myDir = this.Dir.RIGHT; break;
        case '\t': this.myDir = this.Dir.STOP; break;
      }
      this.mainGameMechsRef.clearInput();
    }
    movePlayer(foodConsumed) {
      let newX = this.playerPosList.getHeadElement().x;
      let newY = this.playerPosList.getHeadElement().y;
      switch (this.myDir) {
        case this.Dir.UP: newY--; break;
        case this.Dir.DOWN: newY++; break;
        case this.Dir.LEFT: newX--; break;
        case this.Dir.RIGHT: newX++; break;
        default: return;
      }
      const bw = this.mainGameMechsRef.getBoardSizeX();
      const bh = this.mainGameMechsRef.getBoardSizeY();
      if (newX < 1) newX = bw - 2;
      else if (newX >= bw - 1) newX = 1;
      if (newY < 1) newY = bh - 2;
      else if (newY >= bh - 1) newY = 1;
      if (this.selfCollisionChecker()) {
        this.mainGameMechsRef.setLoseFlag();
        this.mainGameMechsRef.setExitTrue();
        return;
      }
      this.playerPosList.insertHead(new objPos(newX, newY, '@'));
      if (!foodConsumed) this.playerPosList.removeTail();
    }
    selfCollisionChecker() {
      if (this.myDir === this.Dir.STOP) return false;
      const head = this.playerPosList.getHeadElement();
      for (let i = 1; i < this.playerPosList.getSize(); i++) {
        const seg = this.playerPosList.getElement(i);
        if (head.x === seg.x && head.y === seg.y) return true;
      }
      return false;
    }
  }

  class Food {
    constructor(boardX, boardY) {
      this.boardX = boardX;
      this.boardY = boardY;
      this.pos = new objPos(0, 0, 'o');
      this.generateFood(new objPosArrayList());
    }
    getFoodPos() { return this.pos; }
    generateFood(blockOff) {
      let x, y, valid;
      do {
        valid = true;
        x = Math.floor(Math.random() * (this.boardX - 2)) + 1;
        y = Math.floor(Math.random() * (this.boardY - 2)) + 1;
        for (let i = 0; i < blockOff.getSize(); i++) {
          const seg = blockOff.getElement(i);
          if (seg.x === x && seg.y === y) { valid = false; break; }
        }
      } while (!valid);
      this.pos.setObjPos(x, y, 'o');
    }
  }

  // ========== GAME STATE ==========

  let gm, player, food;
  let running = false;
  let gameOver = false;
  let lastTime = 0;
  let accumulator = 0;
  let animFrameId = null;
  let threeScene = null;
  let threeObjects = [];

  const ctx = canvas2D.getContext('2d');
  const CELL_W = canvas2D.width / gm ? 20 : 20;
  const CELL_H = canvas2D.height / gm ? 20 : 20;

  function resetGame() {
    gm = new GameMechs();
    player = new Player(gm);
    food = new Food(gm.getBoardSizeX(), gm.getBoardSizeY());
    food.generateFood(player.getPlayerPosListRef());
    gameOver = false;
    running = true;
    document.getElementById('gameOverOverlay').classList.remove('show');
    updateScore();
  }

  function updateScore() {
    document.getElementById('snakeScore').textContent = 'Score: ' + gm.getScore();
  }

  function getDelayMs() {
    return Math.max(50, Math.min(500, gm.getSpeed() / 1000));
  }

  // ========== 2D RENDERER ==========

  function render2D() {
    const W = canvas2D.width;
    const H = canvas2D.height;
    const bw = gm.getBoardSizeX();
    const bh = gm.getBoardSizeY();
    const cw = W / bw;
    const ch = H / bh;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f9f6ff';
    ctx.fillRect(0, 0, W, H);
    for (let row = 0; row < bh; row++) {
      for (let col = 0; col < bw; col++) {
        const x = col * cw, y = row * ch;
        if (row === 0 || row === bh - 1 || col === 0 || col === bw - 1) {
          ctx.fillStyle = '#e8e0f0';
          ctx.fillRect(x, y, cw, ch);
          ctx.strokeStyle = '#d8c8ff';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cw, ch);
        } else {
          const isEven = (row + col) % 2 === 0;
          ctx.fillStyle = isEven ? '#fffafc' : '#f3ecff';
          ctx.fillRect(x, y, cw, ch);
        }
      }
    }
    const fPos = food.getFoodPos();
    ctx.fillStyle = '#ff87b2';
    ctx.shadowColor = '#ff87b2';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(fPos.x * cw + cw / 2, fPos.y * ch + ch / 2, cw * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    const snakeList = player.getPlayerPosListRef();
    for (let i = snakeList.getSize() - 1; i >= 0; i--) {
      const seg = snakeList.getElement(i);
      const sx = seg.x * cw, sy = seg.y * ch;
      const pad = 1;
      if (i === 0) {
        ctx.fillStyle = '#6fcf97';
        ctx.shadowColor = '#6fcf97';
        ctx.shadowBlur = 8;
      } else {
        const t = i / Math.max(snakeList.getSize(), 1);
        ctx.fillStyle = `rgb(${80 + t * 40}, ${160 - t * 60}, ${220 - t * 80})`;
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(sx + pad, sy + pad, cw - pad * 2, ch - pad * 2);
      ctx.shadowBlur = 0;
      if (i === 0) {
        ctx.fillStyle = '#2d2942';
        const eyeS = cw * 0.12;
        ctx.beginPath();
        ctx.arc(sx + cw * 0.35, sy + ch * 0.4, eyeS, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + cw * 0.65, sy + ch * 0.4, eyeS, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ========== 3D RENDERER ==========

  function init3D() {
    if (!container3D || !window.THREE) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const W = container3D.clientWidth || 400;
    const H = container3D.clientHeight || 300;
    const bw = 30, bh = 15;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3ecff);
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    const cx = bw / 2 - 0.5, cy = -0.5, cz = bh / 2 - 0.5;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // reposition helpers
  
    const gridHelper = new THREE.GridHelper(Math.max(bw, bh), Math.max(bw, bh), 0xe8e0f0, 0xf3ecff);
    gridHelper.position.set(cx, -0.45, -cz);
  
    const borderMat = new THREE.LineBasicMaterial({ color: 0xd8c8ff, transparent: true, opacity: 0.35 });
    const borderPoints = [];
    for (let i = 0; i <= bw; i++) borderPoints.push(new THREE.Vector3(i - 0.5, -0.45, 0.5));
    for (let i = 0; i <= bh; i++) borderPoints.push(new THREE.Vector3(bw - 0.5, -0.45, -(i - 0.5)));
    for (let i = bw; i >= 0; i--) borderPoints.push(new THREE.Vector3(i - 0.5, -0.45, -(bh - 0.5)));
    for (let i = bh; i >= 0; i--) borderPoints.push(new THREE.Vector3(-0.5, -0.45, -(i - 0.5)));
    borderPoints.push(new THREE.Vector3(-0.5, -0.45, 0.5));
    const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const borderLine = new THREE.Line(borderGeo, borderMat);
  
    const planeGeo = new THREE.PlaneGeometry(bw, bh);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0xfffafc, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(cx, -0.5, -cz);
  
    scene.add(plane);
    scene.add(gridHelper);
    scene.add(borderLine);

    camera.up.set(0, 0, 1);
    camera.position.set(cx, 28, -cz);
    camera.lookAt(cx, cy, -cz);
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container3D.appendChild(renderer.domElement);
    const ambient = new THREE.AmbientLight(0xffe8d0, 0.8);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(8, 14, 10);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xd8c8ff, 0.3);
    fillLight.position.set(-6, 4, 6);
    scene.add(fillLight);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(cx, cy, -cz);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 60;
    controls.update();
    function onResize() {
      const w = container3D.clientWidth, h = Math.max(200, Math.min(350, w * 0.6));
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);
    return { scene, camera, renderer, controls, bw, bh };
  }

  // ========== GAME LOOP ==========

  function gameLoop(timestamp) {
    if (!running) return;
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    accumulator += delta;
    const delay = getDelayMs();
    while (accumulator >= delay) {
      accumulator -= delay;
      player.updatePlayerDir();
      const head = player.getHeadPos();
      const foodPos = food.getFoodPos();
      if (head.x === foodPos.x && head.y === foodPos.y) {
        gm.incrementScore();
        updateScore();
        food.generateFood(player.getPlayerPosListRef());
        player.movePlayer(true);
      } else {
        player.movePlayer(false);
      }
      if (gm.getExitFlagStatus()) {
        running = false;
        gameOver = true;
        document.getElementById('gameOverMsg').textContent =
          gm.getLoseFlagStatus() ? 'You ran into yourself!' : 'Game stopped!';
        document.getElementById('gameOverScore').textContent = 'Score: ' + gm.getScore();
        document.getElementById('gameOverOverlay').classList.add('show');
        break;
      }
    }
    render2D();
    render3D();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  // ========== 3D RENDER HELPER ==========

  function render3D() {
    if (!threeScene) return;
    const bw = threeScene.bw, bh = threeScene.bh;
    const flipY = (y) => -y;
    threeScene.controls.update();
    for (const o of threeObjects) { threeScene.scene.remove(o); }
    threeObjects = [];
    const snakeList = player.getPlayerPosListRef();
    for (let i = 0; i < snakeList.getSize(); i++) {
      const seg = snakeList.getElement(i);
      const z = flipY(seg.y);
      const geo = new THREE.BoxGeometry(0.85, 0.7, 0.85);
      let color;
      if (i === 0) color = 0x6fcf97;
      else { const t = i / Math.max(snakeList.getSize(), 1); color = new THREE.Color().setHSL(0.3 - t * 0.08, 0.45, 0.6 - t * 0.1); }
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.1 });
      const cube = new THREE.Mesh(geo, mat);
      cube.position.set(seg.x, 0, z);
      threeObjects.push(cube);
      threeScene.scene.add(cube);
      if (i === 0) {
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const eGeo = new THREE.SphereGeometry(0.1, 6, 6);
        const e1 = new THREE.Mesh(eGeo, eyeMat); e1.position.set(seg.x - 0.2, 0.15, z - 0.25); threeObjects.push(e1); threeScene.scene.add(e1);
        const e2 = new THREE.Mesh(eGeo, eyeMat); e2.position.set(seg.x + 0.2, 0.15, z - 0.25); threeObjects.push(e2); threeScene.scene.add(e2);
        const pMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const pGeo = new THREE.SphereGeometry(0.05, 6, 6);
        const p1 = new THREE.Mesh(pGeo, pMat); p1.position.set(seg.x - 0.2, 0.15, z - 0.3); threeObjects.push(p1); threeScene.scene.add(p1);
        const p2 = new THREE.Mesh(pGeo, pMat); p2.position.set(seg.x + 0.2, 0.15, z - 0.3); threeObjects.push(p2); threeScene.scene.add(p2);
      }
    }
    const fPos = food.getFoodPos();
    const fz = flipY(fPos.y);
    const fMat = new THREE.MeshStandardMaterial({ color: 0xff87b2, emissive: 0xff87b2, emissiveIntensity: 0.3, transparent: true, opacity: 0.9 });
    const fGeo = new THREE.SphereGeometry(0.4, 12, 12);
    const fMesh = new THREE.Mesh(fGeo, fMat);
    fMesh.position.set(fPos.x, 0.2, fz);
    threeObjects.push(fMesh);
    threeScene.scene.add(fMesh);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff87b2, transparent: true, opacity: 0.12 });
    const gGeo = new THREE.SphereGeometry(0.7, 12, 12);
    const gMesh = new THREE.Mesh(gGeo, glowMat);
    gMesh.position.set(fPos.x, 0.15, fz);
    threeObjects.push(gMesh);
    threeScene.scene.add(gMesh);
    threeScene.renderer.render(threeScene.scene, threeScene.camera);
  }

  // ========== INPUT HANDLING ==========

  document.addEventListener('keydown', e => {
    const key = e.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab'].includes(key)) {
      e.preventDefault();
    }
    if (key === 'r' || key === 'R') { resetGame(); if (!animFrameId) { lastTime = 0; accumulator = 0; animFrameId = requestAnimationFrame(gameLoop); } return; }
    if (key === '+' || key === '=') { gm.setSpeed(gm.getSpeed() - 10000); return; }
    if (key === '-') { gm.setSpeed(gm.getSpeed() + 10000); return; }
    if (!running || gameOver) return;
    let mapped = '';
    switch (key) {
      case 'w': case 'W': mapped = 'w'; break;
      case 'a': case 'A': mapped = 'a'; break;
      case 's': case 'S': mapped = 's'; break;
      case 'd': case 'D': mapped = 'd'; break;
      case 'ArrowUp': mapped = 'w'; break;
      case 'ArrowDown': mapped = 's'; break;
      case 'ArrowLeft': mapped = 'a'; break;
      case 'ArrowRight': mapped = 'd'; break;
      case '\t': mapped = '\t'; break;
    }
    if (mapped) gm.setInput(mapped);
  });

  document.getElementById('restartBtn').addEventListener('click', () => {
    resetGame();
    lastTime = 0; accumulator = 0;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  });

  // ========== INIT ==========

  if (window.THREE && container3D) {
    threeScene = init3D();
  }

  resetGame();
  lastTime = 0;
  accumulator = 0;
  animFrameId = requestAnimationFrame(gameLoop);
})();
