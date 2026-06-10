(function initPCB3D() {
  const container = document.getElementById("pcb3dContainer");
  if (!container || !window.THREE) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const W = container.clientWidth;
  const H = container.clientHeight || 420;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0820);

  const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
  camera.position.set(5, 4, 7);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0x443366, 0.4);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffe8d0, 1.4);
  dirLight.position.set(6, 12, 8); dirLight.castShadow = true;
  scene.add(dirLight);
  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.5);
  fillLight.position.set(-5, 2, 4); scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0x66ccff, 0.35);
  rimLight.position.set(0, -4, -6); scene.add(rimLight);

  const BW = 6.4, BD = 4.8, BH = 0.18;
  const boardGeo = new THREE.BoxGeometry(BW, BH, BD);
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.75, metalness: 0.08, emissive: 0x0a180a, emissiveIntensity: 0.08 });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.y = -BH / 2; board.receiveShadow = true; board.castShadow = true;
  scene.add(board);

  const edgeGeo = new THREE.EdgesGeometry(boardGeo);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x2a5a2a, transparent: true, opacity: 0.35 });
  const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
  edgeLine.position.copy(board.position); scene.add(edgeLine);

  function addMountHole(x, z) {
    const outer = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.16, 16), new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.8, side: THREE.DoubleSide }));
    outer.position.set(x, 0.02, z); outer.rotation.x = -Math.PI / 2; scene.add(outer);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.1, side: THREE.DoubleSide }));
    inner.position.set(x, 0.021, z); inner.rotation.x = -Math.PI / 2; scene.add(inner);
  }
  addMountHole(-BW / 2 + 0.3, -BD / 2 + 0.3);
  addMountHole(BW / 2 - 0.3, -BD / 2 + 0.3);
  addMountHole(-BW / 2 + 0.3, BD / 2 - 0.3);
  addMountHole(BW / 2 - 0.3, BD / 2 - 0.3);

  function makeSilkCanvas(text) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 64;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.font = "bold 36px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 32);
    return c;
  }
  function addSilkText(px, pz, text, w, h) {
    const tex = new THREE.CanvasTexture(makeSilkCanvas(text)); tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(px, 0.02, pz); sprite.scale.set(w || 1.0, h || 0.25, 1);
    scene.add(sprite);
  }
  addSilkText(0, 1.8, "MSP432", 1.4, 0.3);
  addSilkText(-1.8, -1.8, "BOOSTXL", 0.8, 0.18);

  function addTrace(x, z, w, l, ry) {
    const geo = new THREE.BoxGeometry(l, 0.015, w);
    const mat = new THREE.MeshStandardMaterial({ color: 0xbb8833, roughness: 0.25, metalness: 0.85, emissive: 0x442200, emissiveIntensity: 0.03 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.02, z); mesh.rotation.y = ry || 0;
    scene.add(mesh);
  }
  const traces = [
    { x: -2.4, z: -1.0, w: 0.04, l: 0.7 }, { x: -0.8, z: -1.0, w: 0.04, l: 0.5 },
    { x: 0.6, z: -1.0, w: 0.04, l: 0.6 }, { x: 2.0, z: -1.0, w: 0.04, l: 0.5 },
    { x: -2.6, z: -0.2, w: 0.04, l: 0.5 }, { x: -1.2, z: -0.2, w: 0.04, l: 0.6 },
    { x: 0.2, z: -0.2, w: 0.04, l: 0.7 }, { x: 1.6, z: -0.2, w: 0.04, l: 0.5 },
    { x: -2.4, z: 0.6, w: 0.04, l: 0.6 }, { x: -1.0, z: 0.6, w: 0.04, l: 0.5 },
    { x: 0.4, z: 0.6, w: 0.04, l: 0.6 }, { x: 1.8, z: 0.6, w: 0.04, l: 0.6 },
    { x: -2.6, z: 1.4, w: 0.04, l: 0.6 }, { x: -1.2, z: 1.4, w: 0.04, l: 0.5 },
    { x: 0.2, z: 1.4, w: 0.04, l: 0.5 }, { x: 1.6, z: 1.4, w: 0.04, l: 0.7 },
    { x: -2.0, z: 2.0, w: 0.04, l: 0.4 }, { x: -0.4, z: 2.0, w: 0.04, l: 0.5 },
    { x: 1.0, z: 2.0, w: 0.04, l: 0.4 },
  ];
  traces.forEach(t => addTrace(t.x, t.z, t.w, t.l, t.r || 0));

  const vtraces = [
    { x: -2.4, z: -0.5, w: 0.04, l: 0.5, r: Math.PI / 2 },
    { x: -1.0, z: -0.5, w: 0.04, l: 0.6, r: Math.PI / 2 },
    { x: 0.5, z: -0.5, w: 0.04, l: 0.4, r: Math.PI / 2 },
    { x: 2.0, z: -0.5, w: 0.04, l: 0.5, r: Math.PI / 2 },
    { x: -2.4, z: 1.0, w: 0.04, l: 0.5, r: Math.PI / 2 },
    { x: -0.8, z: 1.0, w: 0.04, l: 0.5, r: Math.PI / 2 },
    { x: 0.6, z: 1.0, w: 0.04, l: 0.6, r: Math.PI / 2 },
    { x: 2.0, z: 1.0, w: 0.04, l: 0.4, r: Math.PI / 2 },
  ];
  vtraces.forEach(t => addTrace(t.x, t.z, t.w, t.l, t.r));

  function addVia(x, z) {
    const g = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12);
    const m = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.2, metalness: 0.9 });
    const mesh = new THREE.Mesh(g, m); mesh.position.set(x, 0.04, z); scene.add(mesh);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.09, 16),
      new THREE.MeshStandardMaterial({ color: 0xbb8833, roughness: 0.3, metalness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.4 }));
    ring.position.set(x, 0.06, z); ring.rotation.x = -Math.PI / 2; scene.add(ring);
  }
  const vias = [[-2.4, -1.0],[-1.0,-1.0],[0.6,-1.0],[2.0,-0.5],[-2.6,-0.2],[-1.2,-0.2],[0.2,-0.2],[1.6,-0.2],[-2.4,0.6],[-1.0,0.6],[0.4,0.6],[1.8,0.6],[-2.6,1.4],[-1.2,1.4],[0.2,1.4],[1.6,1.4],[-2.0,2.0],[-0.4,2.0],[1.0,2.0]];
  vias.forEach(p => addVia(p[0], p[1]));

  function addMCU(x, z, s, h, color) {
    const geo = new THREE.BoxGeometry(s, h, s);
    const mat = new THREE.MeshStandardMaterial({ color: color||0x111122, roughness: 0.35, metalness: 0.25, emissive: 0x0a0a18, emissiveIntensity: 0.04 });
    const mcu = new THREE.Mesh(geo, mat); mcu.position.set(x, h/2+0.02, z); mcu.castShadow = true; mcu.receiveShadow = true; scene.add(mcu);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.15, metalness: 0.95 });
    for (let sd = 0; sd < 4; sd++) {
      for (let i = 0; i < 8; i++) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.03), pinMat);
        const sp = s / 9, off = -s/2 + sp*(i+1); let px=0, pz=0;
        if (sd===0) { px=-s/2-0.03; pz=off; } if (sd===1) { px=s/2+0.03; pz=off; }
        if (sd===2) { px=off; pz=-s/2-0.03; } if (sd===3) { px=off; pz=s/2+0.03; }
        pin.position.set(x+px, 0.04, z+pz); scene.add(pin);
      }
    }
    const mark = new THREE.Mesh(new THREE.BoxGeometry(s*0.5,0.005,s*0.5), new THREE.MeshStandardMaterial({color:0x223344,roughness:0.6,metalness:0.15}));
    mark.position.set(x, h+0.025, z); scene.add(mark);
    return mcu;
  }
  addMCU(0, 0.2, 1.1, 0.14, 0x111128);

  function addHeaderPins(startX, startZ, count, spacing, axis) {
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.15, metalness: 0.95 });
    for (let i = 0; i < count; i++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05), pinMat);
      const px = axis === "x" ? startX : startX + i * spacing;
      const pz = axis === "z" ? startZ : startZ + i * spacing;
      pin.position.set(px, 0.08, pz); scene.add(pin);
    }
  }
  addHeaderPins(-BW/2+0.15, -1.6, 12, 0.28, "z");
  addHeaderPins(-BW/2+0.15, 1.6, 10, 0.28, "z");
  addHeaderPins(BW/2-0.15, -1.6, 12, 0.28, "z");
  addHeaderPins(BW/2-0.15, 1.6, 10, 0.28, "z");

  function addUSB(x, z) {
    const g = new THREE.BoxGeometry(0.4, 0.08, 0.3);
    const m = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.7 });
    const usb = new THREE.Mesh(g, m); usb.position.set(x, 0.06, z); scene.add(usb);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.3 }));
    slot.position.set(x, 0.1, z); scene.add(slot);
  }
  addUSB(0, -BD/2+0.15);

  function addButton(x, z) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 12),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.3 }));
    base.position.set(x, 0.06, z); scene.add(base);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 12),
      new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.2 }));
    cap.position.set(x, 0.09, z); scene.add(cap);
  }
  addButton(1.6, -2.0);

  function addLED(x, z, color) {
    const g = new THREE.CylinderGeometry(0.03, 0.04, 0.02, 8);
    const m = new THREE.MeshStandardMaterial({ color: color||0xff2200, emissive: color||0xff2200, emissiveIntensity: 0.6, transparent: true, opacity: 0.9 });
    const led = new THREE.Mesh(g, m); led.position.set(x, 0.03, z);
    led.rotation.x = Math.PI / 2; scene.add(led);
    return led;
  }
  const led1 = addLED(-1.2, -2.1, 0xff4400);
  const led2 = addLED(-0.8, -2.1, 0x00cc44);

  function addCrystal(x, z) {
    const g = new THREE.BoxGeometry(0.2, 0.04, 0.12);
    const m = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.2, metalness: 0.8 });
    const xtal = new THREE.Mesh(g, m); xtal.position.set(x, 0.04, z); scene.add(xtal);
    const cap1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 6),
      new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.3, metalness: 0.7 }));
    cap1.position.set(x-0.06, 0.035, z-0.04); scene.add(cap1);
    const cap2 = cap1.clone(); cap2.position.set(x+0.06, 0.035, z+0.04); scene.add(cap2);
  }
  addCrystal(-1.8, -1.0);

  function addSmallIC(x, z, w, d, h, color) {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.MeshStandardMaterial({ color: color||0x1a1a2a, roughness: 0.35, metalness: 0.2 });
    const ic = new THREE.Mesh(g, m); ic.position.set(x, h/2+0.02, z); scene.add(ic);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.15, metalness: 0.95 });
    for (let i = 0; i < 4; i++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.02), pinMat);
      const sp = w / 5; const off = -w/2 + sp*(i+1);
      pin.position.set(x+off, 0.03, z+d/2+0.02); scene.add(pin);
      const pin2 = pin.clone(); pin2.position.set(x+off, 0.03, z-d/2-0.02); scene.add(pin2);
    }
  }
  addSmallIC(2.2, -0.6, 0.35, 0.3, 0.05, 0x222244);

  function addCap(x, z) {
    const g = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8);
    const m = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.5, metalness: 0.2 });
    const cap = new THREE.Mesh(g, m); cap.position.set(x, 0.03, z); scene.add(cap);
  }
  [[-2.0,0.8],[2.4,0.4],[-2.2,-0.8],[2.4,-1.2],[-2.0,1.6],[2.2,1.6]].forEach(p => addCap(p[0], p[1]));

  function addResistor(x, z) {
    const g = new THREE.BoxGeometry(0.08, 0.02, 0.03);
    const m = new THREE.MeshStandardMaterial({ color: 0x334433, roughness: 0.6, metalness: 0.1 });
    const r = new THREE.Mesh(g, m); r.position.set(x, 0.025, z); r.rotation.y = Math.PI/4; scene.add(r);
  }
  [[1.8,1.8],[-1.8,1.0],[2.2,-0.8]].forEach(p => addResistor(p[0], p[1]));

  const glowMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.4, transparent: true, opacity: 0.5 });
  vias.forEach(p => {
    const g = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), glowMat);
    g.position.set(p[0], 0.07, p[1]); scene.add(g);
  });

  let mouseX=0, mouseY=0, isDragging=false, prevMX=0, prevMY=0, dragRX=0, dragRY=0, autoRotate=true;
  container.addEventListener("mousedown", e => { isDragging=true; autoRotate=false; prevMX=e.clientX; prevMY=e.clientY; });
  window.addEventListener("mousemove", e => {
    mouseX = (e.clientX/window.innerWidth)*2-1; mouseY = (e.clientY/window.innerHeight)*2-1;
    if (isDragging) { dragRY += (e.clientX-prevMX)*0.01; dragRX += (e.clientY-prevMY)*0.01; prevMX=e.clientX; prevMY=e.clientY; }
  });
  window.addEventListener("mouseup", () => { if(isDragging){isDragging=false;setTimeout(()=>{autoRotate=true},2000)} });
  container.addEventListener("touchstart", e => { const t=e.touches[0]; isDragging=true; autoRotate=false; prevMX=t.clientX; prevMY=t.clientY; }, {passive:true});
  container.addEventListener("touchmove", e => { const t=e.touches[0]; if(isDragging){dragRY+=(t.clientX-prevMX)*0.01;dragRX+=(t.clientY-prevMY)*0.01;prevMX=t.clientX;prevMY=t.clientY} }, {passive:true});
  container.addEventListener("touchend", () => { isDragging=false; setTimeout(()=>{autoRotate=true},2000) }, {passive:true});

  let time = 0;
  function animate() {
    requestAnimationFrame(animate); time += 0.01;
    if (autoRotate) dragRY += 0.003;
    scene.rotation.x = (Math.sin(time*0.5)*0.06 + dragRX)*0.3;
    scene.rotation.y = dragRY;
    const p = 0.4 + Math.sin(time*2)*0.15;
    glowMat.emissiveIntensity = p;
    led1.material.emissiveIntensity = 0.3 + Math.sin(time*3)*0.3;
    led2.material.emissiveIntensity = 0.2 + Math.sin(time*2.5+1)*0.15;
    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    const w = container.clientWidth, h = Math.max(300, Math.min(500, w*0.5));
    camera.aspect = w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
  }
  window.addEventListener("resize", onResize);
})();
