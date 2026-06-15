// simulation.js — moteur Three.js

let scene, camera, renderer;
let bodyMeshes  = {};
let orbitLines  = {};
let trailLines  = {};
let trailPoints = {};
let timeIndex   = 0;
let playing     = true;
let speed       = 10;
let selectedBody = null;
let raycaster, mouse;
let frameAcc    = 0;

// Caméra sphérique
let spherical    = { theta: 0.5, phi: 1.0, radius: 500 };
let cameraTarget = new THREE.Vector3(0, 0, 0);
let isMouseDown  = false;
let lastMX = 0, lastMY = 0;

let isTransitioning    = false;
let transitionProgress = 0;

const TRAIL_LENGTH = {
    star:      0,
    planet:    60,
    satellite: 90,
    comet:     120,
};

// ── Init ─────────────────────────────────────────

function initThree() {
    const container = document.getElementById('canvas-container');

    scene    = new THREE.Scene();
    camera   = new THREE.PerspectiveCamera(
        45, container.offsetWidth / container.offsetHeight, 0.01, 200000);
    camera.position.set(0, 200, 400);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000);
    container.appendChild(renderer.domElement);

    setupControls();
    addStars();

    const sunLight = new THREE.PointLight(0xffffff, 2, 0, 1);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x111122, 0.8));

    // Marqueur barycentre
    addBarycenterMarker();

    raycaster = new THREE.Raycaster();
    mouse     = new THREE.Vector2();

    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('click', onCanvasClick);

    loadTrajectories('data/trajectoire.json', () => {
        buildScene();
        initUI();
        document.getElementById('time-slider').max = maxSteps() - 1;
        animate();
    });
}

// ── Barycentre ───────────────────────────────────

function addBarycenterMarker() {
    const mat  = new THREE.LineBasicMaterial({
        color: 0x666666, transparent: true, opacity: 0.6 });
    const s    = 2;
    [
        [[-s,0,0],[s,0,0]],
        [[0,-s,0],[0,s,0]],
        [[0,0,-s],[0,0,s]]
    ].forEach(pts => {
        const geo = new THREE.BufferGeometry().setFromPoints(
            pts.map(p => new THREE.Vector3(...p)));
        scene.add(new THREE.Line(geo, mat));
    });
}

// ── Construction scène ────────────────────────────

function buildScene() {
    // Soleil
    const sunGeo  = new THREE.SphereGeometry(0.8, 16, 16);
    const sunMat  = new THREE.MeshBasicMaterial({ color: 0xFDB813 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.userData.name = 'sun';
    scene.add(sunMesh);
    bodyMeshes['sun'] = sunMesh;

    const glowGeo = new THREE.SphereGeometry(1.3, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xFDB813, transparent: true, opacity: 0.05 });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);

    // Ajouter comme enfant du Soleil au lieu de la scène
    sunMesh.add(glowMesh);

    for (const name of bodyNames) {
        if (name === 'sun') continue;
        const cfg = BODY_CONFIG[name];
        if (!cfg) continue;

        // Taille logarithmique entre 0.02 et 0.7 unités Three.js
        const logFactor = Math.log10(cfg.radius_km + 1) / Math.log10(696000);
        const sizeScene = 0.02 + logFactor * 0.68;

        const geo = new THREE.SphereGeometry(sizeScene, 12, 12);
        const mat = new THREE.MeshStandardMaterial({
            color:             cfg.color,
            emissive:          cfg.color,
            emissiveIntensity: 0.2,
            roughness:         0.8,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData.name = name;
        scene.add(mesh);
        bodyMeshes[name] = mesh;

        buildOrbitLine(name, cfg);
        buildTrail(name, cfg);
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
    const opacity = cfg.group === 'satellite' ? 0.06 : 0.12;
    const mat = new THREE.LineBasicMaterial({
        color: cfg.color, transparent: true, opacity
    });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    orbitLines[name] = line;
}

function buildTrail(name, cfg) {
    const len = TRAIL_LENGTH[cfg.group] || 0;
    if (len === 0) return;

    const positions = new Float32Array(len * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
        color: cfg.color, transparent: true, opacity: 0.8
    });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    trailLines[name] = line;
}

// ── Étoiles ───────────────────────────────────────

function addStars() {
    const count     = 6000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i*3]   = (Math.random() - 0.5) * 60000;
        positions[i*3+1] = (Math.random() - 0.5) * 60000;
        positions[i*3+2] = (Math.random() - 0.5) * 60000;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        color: 0xffffff, size: 1.5, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Points(geo, mat));
}

// ── Animation ─────────────────────────────────────

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

    // Mettre à jour positions et visibilité
    for (const name of ['sun', ...bodyNames]) {
        const mesh = bodyMeshes[name];
        if (!mesh) continue;
        const pos = getPosition(name, timeIndex);
        if (!pos) continue;
        const v = posToVec3(pos);
        mesh.position.set(v.x, v.y, v.z);

        // Distance caméra → corps
        const distCam = camera.position.distanceTo(mesh.position);
        const cfg     = BODY_CONFIG[name];

        // Seuil d'apparition selon le type de corps
        // En dessous de ce seuil, le corps est visible
        const threshold = {
            star:      999999,  // toujours visible
            planet:    80,      // visible si caméra à moins de 80 unités
            satellite: 8,       // visible si caméra à moins de 8 unités
            comet:     60,
        }[cfg.group] || 80;

        mesh.visible = distCam < threshold;
    }

    // Soleil toujours visible
    if (bodyMeshes['sun']) {
        const sunPos = getPosition('sun', timeIndex);
        if (sunPos) {
            const v = posToVec3(sunPos);
            bodyMeshes['sun'].position.set(v.x, v.y, v.z);
        }
        bodyMeshes['sun'].visible = true;
    }

    updateTrails();
    updateControls();
    renderer.render(scene, camera);
    updateSidebar();
    updateSimTime();
}

// ── Traînées ──────────────────────────────────────

function updateTrails() {
    for (const name of bodyNames) {
        const line = trailLines[name];
        if (!line) continue;

        const cfg = BODY_CONFIG[name];
        const len = TRAIL_LENGTH[cfg.group] || 0;
        const pos = getPosition(name, timeIndex);
        if (!pos) continue;

        const hist = trailPoints[name];
        hist.push(posToVec3(pos));
        if (hist.length > len) hist.shift();

        const arr = line.geometry.attributes.position.array;
        for (let i = 0; i < hist.length; i++) {
            arr[i*3]   = hist[i].x;
            arr[i*3+1] = hist[i].y;
            arr[i*3+2] = hist[i].z;
        }
        line.geometry.attributes.position.needsUpdate = true;
        line.geometry.setDrawRange(0, hist.length);

        // Plus lumineux si sélectionné
        line.material.opacity = (name === selectedBody) ? 1.0 : 0.7;
    }
}

// ── Contrôles caméra ─────────────────────────────

function setupControls() {
    const el = renderer.domElement;

    el.addEventListener('mousedown', e => {
        isMouseDown = true;
        lastMX = e.clientX;
        lastMY = e.clientY;
    });
    el.addEventListener('mouseup',    () => { isMouseDown = false; });
    el.addEventListener('mouseleave', () => { isMouseDown = false; });
    el.addEventListener('mousemove',  e => {
        if (!isMouseDown) return;
        spherical.theta -= (e.clientX - lastMX) * 0.005;
        spherical.phi    = Math.max(0.05, Math.min(Math.PI - 0.05,
                           spherical.phi + (e.clientY - lastMY) * 0.005));
        lastMX = e.clientX;
        lastMY = e.clientY;
    });
    el.addEventListener('wheel', e => {
        spherical.radius *= e.deltaY > 0 ? 1.08 : 0.92;
        spherical.radius  = Math.max(0.001, Math.min(8000, spherical.radius));
        e.preventDefault();
    }, { passive: false });
}

function updateControls() {
    if (selectedBody && bodyMeshes[selectedBody]) {
        const target = bodyMeshes[selectedBody].position;

        if (isTransitioning) {
            // Transition douce vers le nouveau corps
            transitionProgress += 0.05;
            if (transitionProgress >= 1) {
                transitionProgress = 1;
                isTransitioning    = false;
            }
            cameraTarget.lerp(target, transitionProgress);
        } else {
            // Suivi exact sans lag — colle au corps
            cameraTarget.copy(target);
        }
    } else {
        cameraTarget.lerp(new THREE.Vector3(0, 0, 0), 0.05);
    }

    camera.position.set(
        cameraTarget.x + spherical.radius
            * Math.sin(spherical.phi) * Math.sin(spherical.theta),
        cameraTarget.y + spherical.radius * Math.cos(spherical.phi),
        cameraTarget.z + spherical.radius
            * Math.sin(spherical.phi) * Math.cos(spherical.theta)
    );
    camera.lookAt(cameraTarget);
}

// ── Clic ─────────────────────────────────────────

function onCanvasClick(e) {
    // Ignorer si on était en train de draguer
    if (isMouseDown) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Augmenter le threshold du raycaster pour les petits corps
    raycaster.params.Points.threshold = 2;

    const meshList = Object.values(bodyMeshes);
    const hits     = raycaster.intersectObjects(meshList);

    if (hits.length > 0) {
        selectBody(hits[0].object.userData.name);
    }
}

// ── Temps ─────────────────────────────────────────

function updateSimTime() {
    const years = Math.floor(timeIndex / 365);
    const days  = timeIndex % 365;
    document.getElementById('sim-time').textContent =
        years > 0 ? `An ${years}, Jour ${days}` : `Jour ${timeIndex}`;
}

// ── Resize ────────────────────────────────────────

function onResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

window.addEventListener('load', initThree);