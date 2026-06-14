// simulation.js — moteur Three.js

let scene, camera, renderer, controls;
let bodyMeshes  = {};
let orbitLines  = {};
let timeIndex   = 0;
let playing     = true;
let speed       = 10;
let selectedBody = null;
let clock;
let raycaster, mouse;
let labelRenderer;

// ── Init ─────────────────────────────────────────

function initThree() {
    const container = document.getElementById('canvas-container');

    // Scène
    scene = new THREE.Scene();

    // Caméra
    camera = new THREE.PerspectiveCamera(
        45,
        container.offsetWidth / container.offsetHeight,
        0.1,
        100000
    );
    camera.position.set(0, 200, 400);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000);
    container.appendChild(renderer.domElement);

    // OrbitControls maison — rotation + zoom souris
    setupControls();

    // Étoiles
    addStars();

    // Lumière solaire
    const sunLight = new THREE.PointLight(0xffffff, 2, 0, 1);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x111122, 0.5));

    // Raycaster pour clic
    raycaster = new THREE.Raycaster();
    mouse     = new THREE.Vector2();

    clock = new THREE.Clock();

    // Événements
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('click', onCanvasClick);

    // Charger JSON puis construire la scène
    loadTrajectories('data/trajectoire.json', () => {
        buildScene();
        initUI();
        document.getElementById('time-slider').max = maxSteps() - 1;
        animate();
    });
}

// ── Construction de la scène ─────────────────────

// Longueur de la trainee en nombre de points JSON
// 30 points = 30 jours de trainee visible
const TRAIL_LENGTH = {
    star:      0,    // pas de trainee pour le soleil
    planet:    60,   // 60 jours
    satellite: 90,   // 90 jours — plus longue car orbit plus courte
    comet:     120,  // 120 jours — tres visible
};

let trailLines  = {};   // lignes de trainee dynamiques
let trailPoints = {};   // historique des positions pour la trainee

function buildScene() {
    // Soleil
    const sunSize = getVisualSize('sun');
    const sunGeo  = new THREE.SphereGeometry(sunSize, 32, 32);
    const sunMat  = new THREE.MeshBasicMaterial({ color: 0xFDB813 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);
    bodyMeshes['sun'] = sunMesh;

    // Halo du soleil
    const glowGeo = new THREE.SphereGeometry(sunSize * 1.4, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xFDB813, transparent: true, opacity: 0.06
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    for (const name of bodyNames) {
        const cfg  = BODY_CONFIG[name];
        if (!cfg) continue;

        const size = getVisualSize(name);

        // Mesh du corps
        const geo  = new THREE.SphereGeometry(size, 16, 16);
        const mat  = new THREE.MeshStandardMaterial({
            color:             cfg.color,
            roughness:         0.8,
            metalness:         0.0,
            emissive:          cfg.color,
            emissiveIntensity: 0.15
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData.name = name;
        scene.add(mesh);
        bodyMeshes[name] = mesh;

        // Orbite complete — tres discrete
        buildOrbitLine(name, cfg);

        // Trainee lumineuse — initialisee vide
        buildTrail(name, cfg);

        // Historique des positions pour la trainee
        trailPoints[name] = [];
    }
}

function buildOrbitLine(name, cfg) {
    const pts = trajectories[name];
    if (!pts || pts.length < 2) return;

    const stride = cfg.group === 'satellite' ? 2 : 1;
    const points = [];
    for (let i = 0; i < pts.length; i += stride)
        points.push(posToVec3(pts[i][0]));
    points.push(points[0]);

    const geo = new THREE.BufferGeometry().setFromPoints(points);

    // Tres discret — presque invisible, juste un guide
    const opacity = cfg.group === 'satellite' ? 0.08 : 0.15;
    const mat = new THREE.LineBasicMaterial({
        color: cfg.color, transparent: true, opacity
    });

    const line = new THREE.Line(geo, mat);
    scene.add(line);
    orbitLines[name] = line;
}

function buildTrail(name, cfg) {
    const len = TRAIL_LENGTH[cfg.group] || 30;
    if (len === 0) return;

    // Geometry avec positions vides — mise a jour a chaque frame
    const positions = new Float32Array(len * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',
        new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
        color:       cfg.color,
        transparent: true,
        opacity:     0.7,
        linewidth:   1
    });

    const line = new THREE.Line(geo, mat);
    scene.add(line);
    trailLines[name] = line;
}

function updateTrails() {
    for (const name of bodyNames) {
        const line = trailLines[name];
        if (!line) continue;

        const cfg = BODY_CONFIG[name];
        const len = TRAIL_LENGTH[cfg.group] || 30;
        const pos = getPosition(name, timeIndex);
        if (!pos) continue;

        // Ajouter la position courante a l'historique
        const hist = trailPoints[name];
        hist.push(posToVec3(pos));
        if (hist.length > len) hist.shift();

        // Mettre a jour la geometry
        const positions = line.geometry.attributes.position.array;
        for (let i = 0; i < hist.length; i++) {
            positions[i * 3]     = hist[i].x;
            positions[i * 3 + 1] = hist[i].y;
            positions[i * 3 + 2] = hist[i].z;
        }
        line.geometry.attributes.position.needsUpdate = true;
        line.geometry.setDrawRange(0, hist.length);

        // Degrade d'opacite — plus lumineux pres du corps
        // (effet trainee lumineuse)
        line.material.opacity = selectedBody === name ? 0.9 : 0.6;
    }
}

function addStars() {
    const count  = 6000;
    const geo    = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 60000;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 60000;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 60000;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        color: 0xffffff, size: 1.5,
        transparent: true, opacity: 0.8
    });
    scene.add(new THREE.Points(geo, mat));
}

// ── Boucle d'animation ───────────────────────────

let frameAcc = 0;

function animate() {
    requestAnimationFrame(animate);

    if (playing) {
        frameAcc += speed;
        while (frameAcc >= 10) {
            timeIndex = (timeIndex + 1) % maxSteps();
            frameAcc -= 10;
        }
        document.getElementById('time-slider').value = timeIndex;
    }

    // Mettre a jour positions
    for (const name of bodyNames) {
        const mesh = bodyMeshes[name];
        if (!mesh) continue;
        const pos = getPosition(name, timeIndex);
        if (!pos) continue;
        const v = posToVec3(pos);
        mesh.position.set(v.x, v.y, v.z);
    }

    // Mettre a jour les trainees
    updateTrails();

    updateControls();
    renderer.render(scene, camera);
    updateSidebar();
    updateSimTime();
}

// ── OrbitControls maison ─────────────────────────

let isMouseDown   = false;
let lastMX = 0, lastMY = 0;
let spherical = { theta: 0.5, phi: 1.0, radius: 500 };

function setupControls() {
    const el = renderer.domElement;

    el.addEventListener('mousedown', e => {
        isMouseDown = true;
        lastMX = e.clientX;
        lastMY = e.clientY;
    });

    el.addEventListener('mouseup',   () => { isMouseDown = false; });
    el.addEventListener('mouseleave',() => { isMouseDown = false; });

    el.addEventListener('mousemove', e => {
        if (!isMouseDown) return;
        const dx = e.clientX - lastMX;
        const dy = e.clientY - lastMY;
        spherical.theta -= dx * 0.005;
        spherical.phi    = Math.max(0.1,
                           Math.min(Math.PI - 0.1,
                           spherical.phi + dy * 0.005));
        lastMX = e.clientX;
        lastMY = e.clientY;
    });

    el.addEventListener('wheel', e => {
        spherical.radius *= e.deltaY > 0 ? 1.08 : 0.92;
        spherical.radius  = Math.max(20, Math.min(8000, spherical.radius));
        e.preventDefault();
    }, { passive: false });
}

// Cible de la caméra — suit le corps sélectionné
let cameraTarget = new THREE.Vector3(0, 0, 0);

function updateControls() {
    // Si un corps est sélectionné, centrer sur lui
    if (selectedBody && bodyMeshes[selectedBody]) {
        const target = bodyMeshes[selectedBody].position;
        cameraTarget.lerp(target, 0.05);   // transition douce
    } else {
        cameraTarget.lerp(new THREE.Vector3(0, 0, 0), 0.05);
    }

    // Coordonnées sphériques → cartésiennes
    camera.position.set(
        cameraTarget.x + spherical.radius * Math.sin(spherical.phi)
                                          * Math.sin(spherical.theta),
        cameraTarget.y + spherical.radius * Math.cos(spherical.phi),
        cameraTarget.z + spherical.radius * Math.sin(spherical.phi)
                                          * Math.cos(spherical.theta)
    );
    camera.lookAt(cameraTarget);
}

// ── Clic sur un corps ────────────────────────────

function onCanvasClick(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
    mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const meshList = Object.values(bodyMeshes);
    const hits     = raycaster.intersectObjects(meshList);

    if (hits.length > 0) {
        const name = hits[0].object.userData.name;
        selectBody(name);
    }
}

// ── Resize ───────────────────────────────────────

function onResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

// ── Temps affiché ────────────────────────────────

function updateSimTime() {
    const years = Math.floor(timeIndex / 365);
    const days  = timeIndex % 365;
    document.getElementById('sim-time').textContent =
        years > 0 ? `An ${years}, Jour ${days}` : `Jour ${timeIndex}`;
}

// ── Lancement ────────────────────────────────────

window.addEventListener('load', initThree);