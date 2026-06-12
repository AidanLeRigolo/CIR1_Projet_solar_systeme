/* =========================================================
   PROJET KEPLER 3D — script.js
   Three.js · Sphères réalistes · Atmosphère · Ombres
   CIR 1 — Vanilla JS
   ========================================================= */

// ── Palette de couleurs pour les corps célestes
const BODY_PALETTE = [
  { surface: 0x4fc3f7, atmosphere: 0x1a88cc, emissive: 0x0a3355 },  // bleu-glace
  { surface: 0xe8734a, atmosphere: 0xcc4422, emissive: 0x3a0e00 },  // rouge-Mars
  { surface: 0xf5d76e, atmosphere: 0xd4a010, emissive: 0x2a1800 },  // jaune-Vénus
  { surface: 0x66bb6a, atmosphere: 0x2e7d32, emissive: 0x0a1f0a },  // vert
  { surface: 0xab47bc, atmosphere: 0x7b1fa2, emissive: 0x1a0025 },  // violet
  { surface: 0xff8a65, atmosphere: 0xd84315, emissive: 0x2a0a00 },  // orange
  { surface: 0x26c6da, atmosphere: 0x00838f, emissive: 0x001a1f },  // teal
];

// ── État global
const sim = {
  bodies: [],
  frameIndex: 0,
  playing: false,
  speed: 1,
  bodyScale: 1.0,
  showTrail: true,
  showAtmo: true,
  showOrbit: false,
  loaded: false,
  scale: 1,
  midX: 0, midY: 0,
  frameAccum: 0,
};

// ── Three.js objets
let renderer, scene, camera;
let sunMesh, sunLight, ambientLight;
let bodyMeshes    = [];   // sphère principale par corps
let atmoMeshes    = [];   // sphère atmosphère
let fullTrails    = [];   // trajectoire COMPLÈTE fixe (toujours visible)
let recentTrails  = [];   // segment récent lumineux qui suit la planète
let orbitRings    = [];   // anneaux d'orbite
const trailLines  = [];   // alias vide pour compatibilité toggle
let stars;
const PLANET_BASE_RADIUS = 0.04;  // rayon de base en unités scène (avant userScale)

// ── Contrôle caméra maison (OrbitControls n'est pas dispo en r128 standalone)
const cam = {
  theta: 0.5, phi: 1.0, radius: 4,
  panX: 0, panY: 0,
  isDragging: false, isPanning: false,
  lastX: 0, lastY: 0,
};

// ─────────────────────────────────────────────
// INIT THREE.JS
// ─────────────────────────────────────────────
function initThree() {
  const container = document.getElementById('three-canvas-container');
  const W = container.offsetWidth  || 800;
  const H = container.offsetHeight || 600;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020c06);
  scene.fog = new THREE.FogExp2(0x020c06, 0.015);

  // Camera
  camera = new THREE.PerspectiveCamera(50, W / H, 0.001, 1000);
  updateCamera();

  // Lumière ambiante (faible — espace)
  ambientLight = new THREE.AmbientLight(0x0a1f10, 0.4);
  scene.add(ambientLight);

  // Lumière du Soleil (point light puissant)
  sunLight = new THREE.PointLight(0xfff5d0, 3.0, 30, 1.5);
  sunLight.position.set(0, 0, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 0.01;
  sunLight.shadow.camera.far = 20;
  scene.add(sunLight);

  // Champ d'étoiles
  createStarfield();

  // Soleil
  createSun();

  // Évènements souris
  const cvs = renderer.domElement;
  cvs.addEventListener('mousedown', onMouseDown);
  cvs.addEventListener('mousemove', onMouseMove);
  cvs.addEventListener('mouseup',   () => { cam.isDragging = false; cam.isPanning = false; });
  cvs.addEventListener('wheel',     onWheel, { passive: false });
  cvs.addEventListener('contextmenu', e => e.preventDefault());

  // Resize
  window.addEventListener('resize', onResize);

  // Lancer la boucle
  animate();
}

// ─────────────────────────────────────────────
// CHAMP D'ÉTOILES
// ─────────────────────────────────────────────
function createStarfield() {
  const count = 4000;
  const geo   = new THREE.BufferGeometry();
  const pos   = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const rng   = mulberry32(42);

  for (let i = 0; i < count; i++) {
    const theta = rng() * Math.PI * 2;
    const phi   = Math.acos(2 * rng() - 1);
    const r     = 80 + rng() * 200;
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);
    sizes[i]   = 0.3 + rng() * 1.2;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.3,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
  });

  stars = new THREE.Points(geo, mat);
  scene.add(stars);
}

// ─────────────────────────────────────────────
// SOLEIL
// ─────────────────────────────────────────────
function createSun() {
  if (sunMesh) scene.remove(sunMesh);

  // Texture procédurale du soleil (canvas)
  const sunTex = generateSunTexture();

  const geo = new THREE.SphereGeometry(0.12, 32, 32);
  const mat = new THREE.MeshStandardMaterial({
    map: sunTex,
    emissiveMap: sunTex,
    emissive: new THREE.Color(0xffcc44),
    emissiveIntensity: 2.0,
    roughness: 1.0,
    metalness: 0.0,
  });

  sunMesh = new THREE.Mesh(geo, mat);
  sunMesh.castShadow = false;
  sunMesh.receiveShadow = false;
  scene.add(sunMesh);

}

function generateSunTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const rng = mulberry32(7);
  // Fond chaud
  const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grad.addColorStop(0.0, '#fff5b0');
  grad.addColorStop(0.4, '#ffd040');
  grad.addColorStop(0.8, '#ff8800');
  grad.addColorStop(1.0, '#cc4400');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Taches solaires
  for (let i = 0; i < 30; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 2 + rng() * 10;
    const g2 = ctx.createRadialGradient(x, y, 0, x, y, r);
    g2.addColorStop(0, 'rgba(80,20,0,0.5)');
    g2.addColorStop(1, 'rgba(80,20,0,0)');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

// ─────────────────────────────────────────────
// PARSING DU JSON
// ─────────────────────────────────────────────
function parseGGJson(jsonObj) {
  const bodies = [];
  let idx = 0;
  for (const [name, frames] of Object.entries(jsonObj)) {
    const parsed = frames.map(entry => ({
      pos:  { x: parseFloat(entry[0][0]), y: parseFloat(entry[0][1]), z: parseFloat(entry[0][2]) },
      vel:  { x: parseFloat(entry[1][0]), y: parseFloat(entry[1][1]), z: parseFloat(entry[1][2]) },
      step: entry[2],
    }));
    bodies.push({ name, frames: parsed, paletteIdx: idx % BODY_PALETTE.length });
    idx++;
  }
  return bodies;
}

// ─────────────────────────────────────────────
// CALCUL ÉCHELLE AUTO
// Centre sur le Soleil (0,0) et calcule l'aphélie pour le clamping visuel
// ─────────────────────────────────────────────
function computeAutoScale(bodies) {
  let maxDist = 0;
  for (const body of bodies) {
    for (const f of body.frames) {
      const d = Math.sqrt(f.pos.x * f.pos.x + f.pos.y * f.pos.y);
      if (d > maxDist) maxDist = d;
    }
  }
  if (maxDist === 0) maxDist = 1;
  sim._aphelion = maxDist;          // distance max depuis le Soleil (aphélie)
  sim.scale = 1.4 / maxDist;        // fait tenir l'orbite dans ±1.4 unités scène
  sim.midX  = 0;                    // centré sur le Soleil
  sim.midY  = 0;
}

// Coordonnées monde → Three.js
// Quand la planète est à moins de 50% de l'aphélie,
// on étire sa distance radiale pour qu'elle reste visuellement
// à au moins 50% — la physique de l'ellipse reste lisible
// sans que la planète fonce dans le disque solaire.
function worldToThree(wx, wy) {
  const rawDist   = Math.sqrt(wx * wx + wy * wy);
  const minVisual = (sim._aphelion || rawDist) * 0.50;

  let sx = wx * sim.scale;
  let sy = wy * sim.scale;

  if (rawDist > 1e6 && rawDist < minVisual) {
    const factor = (minVisual * sim.scale) / (rawDist * sim.scale);
    sx *= factor;
    sy *= factor;
  }

  return new THREE.Vector3(sx, 0, sy);
}

// ─────────────────────────────────────────────
// CRÉATION DES OBJETS 3D PAR CORPS
// ─────────────────────────────────────────────
function generatePlanetTexture(palette, seed) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const rng = mulberry32(seed);

  const base = '#' + palette.surface.toString(16).padStart(6, '0');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Bandes atmosphériques
  for (let b = 0; b < 8; b++) {
    const y0 = rng() * size;
    const h  = 5 + rng() * 40;
    const alpha = 0.05 + rng() * 0.15;
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0, y0, size, h);
  }

  // Cratères / taches
  for (let c = 0; c < 20; c++) {
    const cx2 = rng() * size;
    const cy  = rng() * size;
    const r   = 2 + rng() * 14;
    const g   = ctx.createRadialGradient(cx2, cy, 0, cx2, cy, r);
    const dark = `rgba(0,0,0,${0.1 + rng() * 0.3})`;
    g.addColorStop(0, dark);
    g.addColorStop(0.6, `rgba(255,255,255,0.04)`);
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx2, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Reflets lumineux
  const refGrad = ctx.createRadialGradient(size*0.3, size*0.3, 0, size/2, size/2, size*0.7);
  refGrad.addColorStop(0,   'rgba(255,255,255,0.18)');
  refGrad.addColorStop(0.5, 'rgba(255,255,255,0.04)');
  refGrad.addColorStop(1,   'rgba(0,0,0,0.2)');
  ctx.fillStyle = refGrad;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

function generateBumpTexture(seed) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const rng = mulberry32(seed + 100);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 60; i++) {
    const x = rng() * size, y = rng() * size, r = 1 + rng() * 8;
    const g = ctx.createRadialGradient(x,y,0,x,y,r);
    const v = rng() > 0.5 ? 255 : 0;
    g.addColorStop(0, `rgba(${v},${v},${v},0.6)`);
    g.addColorStop(1, 'rgba(128,128,128,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function createPlanetObjects() {
  // Nettoyer les anciens
  [...bodyMeshes, ...atmoMeshes, ...orbitRings, ...fullTrails, ...recentTrails].forEach(o => o && scene.remove(o));
  bodyMeshes = []; atmoMeshes = []; orbitRings = []; fullTrails = []; recentTrails = [];

  for (let i = 0; i < sim.bodies.length; i++) {
    const body   = sim.bodies[i];
    const pal    = BODY_PALETTE[body.paletteIdx];
    const radius = PLANET_BASE_RADIUS * sim.bodyScale;

    // Textures procédurales
    const planetTex = generatePlanetTexture(pal, i * 13 + 7);
    const bumpTex   = generateBumpTexture(i * 13 + 7);

    // Matériau réaliste
    const mat = new THREE.MeshStandardMaterial({
      map:               planetTex,
      bumpMap:           bumpTex,
      bumpScale:         0.004,
      roughness:         0.75,
      metalness:         0.05,
      emissive:          new THREE.Color(pal.emissive),
      emissiveIntensity: 0.08,
    });

    const geo  = new THREE.SphereGeometry(radius, 32, 32);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    bodyMeshes.push(mesh);

    // Atmosphère
    if (sim.showAtmo) {
      const atmoGeo = new THREE.SphereGeometry(radius * 1.35, 32, 32);
      const atmoMat = new THREE.MeshBasicMaterial({
        color:       new THREE.Color(pal.atmosphere),
        transparent: true,
        opacity:     0.18,
        side:        THREE.BackSide,
        blending:    THREE.AdditiveBlending,
        depthWrite:  false,
      });
      const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
      scene.add(atmoMesh);
      atmoMeshes.push(atmoMesh);
    } else {
      atmoMeshes.push(null);
    }

    // ── TRAJECTOIRE COMPLÈTE (fixe, toujours affichée dès le début)
    // On pré-calcule tous les points une seule fois → très performant
    const allPts = body.frames.map(f => worldToThree(f.pos.x, f.pos.y));
    const fullGeo = new THREE.BufferGeometry().setFromPoints(allPts);
    const fullMat = new THREE.LineBasicMaterial({
      color:       new THREE.Color(pal.surface),
      transparent: true,
      opacity:     0.22,
      depthWrite:  false,
    });
    const fullLine = new THREE.Line(fullGeo, fullMat);
    fullLine.visible = sim.showTrail;
    scene.add(fullLine);
    fullTrails.push(fullLine);

    // ── SEGMENT RÉCENT lumineux (glisse derrière la planète en temps réel)
    const recentGeo = new THREE.BufferGeometry();
    const recentMat = new THREE.LineBasicMaterial({
      color:       new THREE.Color(pal.surface),
      transparent: true,
      opacity:     0.85,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });
    const recentLine = new THREE.Line(recentGeo, recentMat);
    recentLine.visible = sim.showTrail;
    scene.add(recentLine);
    recentTrails.push(recentLine);

    // ── Anneau d'orbite fantôme (optionnel, différent de la trajectoire)
    const orbitMat = new THREE.LineBasicMaterial({
      color:       new THREE.Color(pal.surface),
      transparent: true,
      opacity:     0.08,
    });
    const orbitLine = new THREE.Line(fullGeo, orbitMat); // réutilise la même géométrie
    orbitLine.visible = sim.showOrbit;
    scene.add(orbitLine);
    orbitRings.push(orbitLine);
  }
}

// ─────────────────────────────────────────────
// MISE À JOUR DES POSITIONS À CHAQUE FRAME
// ─────────────────────────────────────────────
function updateScene() {
  const fi = sim.frameIndex;

  for (let i = 0; i < sim.bodies.length; i++) {
    const body   = sim.bodies[i];
    const frame  = body.frames[fi];
    if (!frame) continue;

    const pos3 = worldToThree(frame.pos.x, frame.pos.y);

    // Planète
    if (bodyMeshes[i]) {
      bodyMeshes[i].position.copy(pos3);
      bodyMeshes[i].rotation.y += 0.008; // rotation sur elle-même
    }

    // Atmosphère
    if (atmoMeshes[i]) {
      atmoMeshes[i].position.copy(pos3);
    }

    // Trajectoire complète — toujours affichée, géométrie fixe calculée une fois
    if (fullTrails[i]) {
      fullTrails[i].visible = sim.showTrail;
    }

    // Segment récent lumineux — 120 derniers points, reconstruit à chaque frame
    if (recentTrails[i]) {
      if (sim.showTrail && fi > 0) {
        const RECENT = 120;
        const start  = Math.max(0, fi - RECENT);
        const pts    = [];
        for (let j = start; j <= fi; j++) {
          pts.push(worldToThree(body.frames[j].pos.x, body.frames[j].pos.y));
        }
        recentTrails[i].geometry.setFromPoints(pts);
        recentTrails[i].geometry.computeBoundingSphere();
        recentTrails[i].visible = true;
      } else {
        recentTrails[i].visible = false;
      }
    }
  }

  // Rotation lente du Soleil
  if (sunMesh) sunMesh.rotation.y += 0.002;

  // Rotation lente du champ d'étoiles
  if (stars) stars.rotation.y += 0.00005;
}

// ─────────────────────────────────────────────
// CAMÉRA MAISON (orbite + pan)
// ─────────────────────────────────────────────
function updateCamera() {
  const x = cam.radius * Math.sin(cam.phi) * Math.sin(cam.theta) + cam.panX;
  const y = cam.radius * Math.cos(cam.phi);
  const z = cam.radius * Math.sin(cam.phi) * Math.cos(cam.theta);
  camera.position.set(x, y, z);
  camera.lookAt(cam.panX, 0, cam.panY);
}

function onMouseDown(e) {
  if (e.button === 0) { cam.isDragging = true; cam.isPanning = false; }
  if (e.button === 2) { cam.isPanning = true;  cam.isDragging = false; }
  cam.lastX = e.clientX;
  cam.lastY = e.clientY;
}

function onMouseMove(e) {
  const dx = e.clientX - cam.lastX;
  const dy = e.clientY - cam.lastY;
  if (cam.isDragging) {
    cam.theta -= dx * 0.006;
    cam.phi    = Math.max(0.15, Math.min(Math.PI - 0.15, cam.phi + dy * 0.006));
  }
  if (cam.isPanning) {
    const right = new THREE.Vector3();
    const up    = new THREE.Vector3();
    camera.getWorldDirection(right);
    right.cross(camera.up).normalize();
    up.copy(camera.up);
    const speed = cam.radius * 0.001;
    cam.panX -= dx * speed;
    cam.panY += dy * speed * 0.5;
  }
  cam.lastX = e.clientX;
  cam.lastY = e.clientY;
  updateCamera();
}

function onWheel(e) {
  e.preventDefault();
  cam.radius *= e.deltaY > 0 ? 1.1 : 0.9;
  cam.radius  = Math.max(0.2, Math.min(60, cam.radius));
  updateCamera();
}

function resetCamera() {
  cam.theta  = 0.5; cam.phi = 1.0; cam.radius = 4;
  cam.panX   = 0;   cam.panY = 0;
  updateCamera();
}

function onResize() {
  const container = document.getElementById('three-canvas-container');
  const W = container.offsetWidth  || 800;
  const H = container.offsetHeight || 600;
  renderer.setSize(W, H);
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
}

// ─────────────────────────────────────────────
// BOUCLE D'ANIMATION
// ─────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);

  if (sim.loaded) {
    if (sim.playing) {
      sim.frameAccum += sim.speed;
      while (sim.frameAccum >= 1) {
        const max = maxFrameCount();
        if (sim.frameIndex < max - 1) {
          sim.frameIndex++;
        } else {
          sim.playing = false;
          updatePlayBtn();
        }
        sim.frameAccum -= 1;
      }
    }
    updateScene();
    updateProgressBar();
    updateDataTable();
  }

  renderer.render(scene, camera);
}

// ─────────────────────────────────────────────
// CHARGEMENT DE LA SIMULATION
// ─────────────────────────────────────────────
function loadSimulation(bodies) {
  sim.bodies      = bodies;
  sim.frameIndex  = 0;
  sim.playing     = false;
  sim.loaded      = true;
  sim.frameAccum  = 0;

  computeAutoScale(bodies);
  createPlanetObjects();

  updateStatus('active', 'Simulation 3D chargée');
  updateBodyList();
  showControls();
  document.getElementById('emptyOverlay').classList.add('hidden');
  document.getElementById('progressWrap').style.display = 'flex';
  resetCamera();
}

// ─────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────
function maxFrameCount() {
  return sim.bodies.reduce((m, b) => Math.max(m, b.frames.length), 0);
}

function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let z = Math.imul(seed ^ seed >>> 15, 1 | seed);
    z = z + Math.imul(z ^ z >>> 7, 61 | z) ^ z;
    return ((z ^ z >>> 14) >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────
// UI DOM
// ─────────────────────────────────────────────
function updateStatus(type, label) {
  const dot = document.getElementById('statusDot');
  const lbl = document.getElementById('statusLabel');
  dot.className   = 'status-dot ' + (type === 'active' ? 'active' : type === 'loading' ? 'loading' : '');
  lbl.textContent = label;
}

function showControls() {
  ['bodyListSection', 'controlsSection', 'infoSection'].forEach(id => {
    document.getElementById(id).style.display = '';
  });
}

function updateBodyList() {
  const container = document.getElementById('bodyList');
  container.innerHTML = '';
  for (let i = 0; i < sim.bodies.length; i++) {
    const body = sim.bodies[i];
    const pal  = BODY_PALETTE[body.paletteIdx];
    const col  = '#' + pal.surface.toString(16).padStart(6, '0');
    const item = document.createElement('div');
    item.className = 'body-item';
    item.style.borderLeftColor = col;
    item.innerHTML = `
      <div class="body-dot" style="background:${col};box-shadow:0 0 8px ${col}"></div>
      <span class="body-name">${body.name}</span>
      <span class="body-frames">${body.frames.length} pts</span>
    `;
    container.appendChild(item);
  }
}

function updateProgressBar() {
  if (!sim.loaded) return;
  const total = maxFrameCount();
  const pct   = total > 1 ? (sim.frameIndex / (total - 1)) * 100 : 0;
  document.getElementById('progressFill').style.width  = pct + '%';
  document.getElementById('progressLabel').textContent = `${sim.frameIndex} / ${total - 1}`;
}

function updateDataTable() {
  if (!sim.loaded || sim.bodies.length === 0) return;
  const table = document.getElementById('dataTable');
  table.innerHTML = '';
  for (const body of sim.bodies) {
    const f = body.frames[sim.frameIndex];
    if (!f) continue;
    const speed = Math.sqrt(f.vel.x**2 + f.vel.y**2);
    const rows  = [
      ['Corps', body.name],
      ['Pos X', f.pos.x.toExponential(3) + ' m'],
      ['Pos Y', f.pos.y.toExponential(3) + ' m'],
      ['|V|',   speed.toExponential(3) + ' m/s'],
      ['Step',  f.step],
    ];
    for (const [k, v] of rows) {
      const row = document.createElement('div');
      row.className = 'data-row';
      row.innerHTML = `<span class="data-key">${k}</span><span class="data-val">${v}</span>`;
      table.appendChild(row);
    }
    if (sim.bodies.length > 1) {
      const sep = document.createElement('div');
      sep.style.cssText = 'height:1px;background:var(--border);margin:4px 0';
      table.appendChild(sep);
    }
  }
}

function updatePlayBtn() {
  const btn = document.getElementById('btnPlay');
  btn.textContent = sim.playing ? '⏸' : '▶';
  btn.title       = sim.playing ? 'Pause' : 'Jouer';
}

// ─────────────────────────────────────────────
// CHARGEMENT FICHIER
// ─────────────────────────────────────────────
function handleFile(file) {
  if (!file) return;
  updateStatus('loading', 'Chargement…');
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json   = JSON.parse(e.target.result);
      const bodies = parseGGJson(json);
      if (bodies.length === 0) throw new Error('Aucun corps détecté.');
      loadSimulation(bodies);
    } catch (err) {
      updateStatus('', 'Erreur JSON');
      alert('Erreur : ' + err.message);
    }
  };
  reader.readAsText(file);
}

// ─────────────────────────────────────────────
// ÉVÉNEMENTS
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  initThree();

  // File input
  document.getElementById('fileInput').addEventListener('change', e => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  // Drag & drop
  const dropZone = document.getElementById('fileDropZone');
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragging'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  // Drop sur canvas aussi
  document.querySelector('.canvas-wrapper').addEventListener('dragover', e => e.preventDefault());
  document.querySelector('.canvas-wrapper').addEventListener('drop', e => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  // Play/Pause
  document.getElementById('btnPlay').addEventListener('click', () => {
    if (!sim.loaded) return;
    if (sim.frameIndex >= maxFrameCount() - 1) { sim.frameIndex = 0; sim.frameAccum = 0; }
    sim.playing = !sim.playing;
    updatePlayBtn();
  });

  document.getElementById('btnPause').addEventListener('click', () => {
    sim.playing = false;
    updatePlayBtn();
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    sim.frameIndex = 0;
    sim.frameAccum = 0;
    sim.playing    = false;
    updatePlayBtn();
    resetCamera();
  });

  // Vitesse
  const speedSlider = document.getElementById('speedSlider');
  speedSlider.addEventListener('input', () => {
    sim.speed = parseInt(speedSlider.value);
    document.getElementById('speedVal').textContent = sim.speed + '×';
  });

  // Taille corps
  const bodySizeSlider = document.getElementById('bodySizeSlider');
  bodySizeSlider.addEventListener('input', () => {
    sim.bodyScale = parseInt(bodySizeSlider.value) / 10;
    document.getElementById('bodySizeVal').textContent = sim.bodyScale.toFixed(1) + '×';
    if (sim.loaded) createPlanetObjects(); // recréer avec nouvelle taille
  });

  // Toggle trail
  const tTrail = document.getElementById('toggleTrail');
  tTrail.addEventListener('click', () => {
    sim.showTrail = !sim.showTrail;
    tTrail.textContent = sim.showTrail ? 'ON' : 'OFF';
    tTrail.classList.toggle('active', sim.showTrail);
    fullTrails.forEach(l   => l && (l.visible = sim.showTrail));
    recentTrails.forEach(l => l && (l.visible = sim.showTrail));
  });

  // Toggle atmosphère
  const tAtmo = document.getElementById('toggleAtmo');
  tAtmo.addEventListener('click', () => {
    sim.showAtmo = !sim.showAtmo;
    tAtmo.textContent = sim.showAtmo ? 'ON' : 'OFF';
    tAtmo.classList.toggle('active', sim.showAtmo);
    atmoMeshes.forEach(m => m && (m.visible = sim.showAtmo));
  });

  // Toggle orbites
  const tOrbit = document.getElementById('toggleOrbit');
  tOrbit.addEventListener('click', () => {
    sim.showOrbit = !sim.showOrbit;
    tOrbit.textContent = sim.showOrbit ? 'ON' : 'OFF';
    tOrbit.classList.toggle('active', sim.showOrbit);
    orbitRings.forEach(r => r && (r.visible = sim.showOrbit));
  });

  // Clavier
  document.addEventListener('keydown', e => {
    if (e.key === 'r' || e.key === 'R') resetCamera();
    if (e.key === ' ') {
      e.preventDefault();
      if (!sim.loaded) return;
      sim.playing = !sim.playing;
      updatePlayBtn();
    }
  });
});