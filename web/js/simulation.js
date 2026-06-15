let scene, camera, renderer;
let bodyMeshes       = {};
let orbitLines       = {};
let trailLines       = {};
let trailPoints      = {};
let timeIndex        = 0;
let playing          = true;
let speed            = 10;
let selectedBody     = null;
let raycaster, mouse;
let frameAcc         = 0;
let isTransitioning  = false;
let transitionProgress = 0;

// Caméra sphérique
let spherical    = { theta: 0.5, phi: 1.0, radius: 80 };
let cameraTarget = new THREE.Vector3(0, 0, 0);
let isMouseDown  = false;
let lastMX = 0, lastMY = 0;

const TRAIL_LENGTH = {
    star:      0,
    planet:    60,
    satellite: 90,
    comet:     120,
};

// ── Init ─────────────────────────────────────────

function initThree() {
    const container = document.getElementById('canvas-container');

    scene  = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        45,
        container.offsetWidth / container.offsetHeight,
        0.000001,   // near très petit pour zoomer sur Phobos
        500000
    );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000);
    container.appendChild(renderer.domElement);

    setupControls();
    addStars();
    addBarycenterMarker();

    const sunLight = new THREE.PointLight(0xffffff, 2, 0, 0);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x111122, 0.6));

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
    const mat = new THREE.LineBasicMaterial({
        color: 0x555555, transparent: true, opacity: 0.5 });
    const s = kmToScene(2_000_000);  // croix de 2 millions de km
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
    const sunRadius = getBodySize('sun');
    const sunGeo    = new THREE.SphereGeometry(sunRadius, 32, 32);
    const sunMat    = new THREE.MeshBasicMaterial({ color: 0xFDB813 });
    const sunMesh   = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.userData.name = 'sun';
    scene.add(sunMesh);
    bodyMeshes['sun'] = sunMesh;

    // Halo soleil — enfant du mesh
    const glowGeo = new THREE.SphereGeometry(sunRadius * 1.4, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xFDB813, transparent: true, opacity: 0.06 });
    sunMesh.add(new THREE.Mesh(glowGeo, glowMat));

    for (const name of bodyNames) {
        if (name === 'sun') continue;
        const cfg  = BODY_CONFIG[name];
        if (!cfg) continue;

        const size = getBodySize(name);

        const geo = new THREE.SphereGeometry(size, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
            color:             cfg.color,
            emissive:          cfg.color,
            emissiveIntensity: 0.2,
            roughness:         0.8,
        });
        const mesh      = new THREE.Mesh(geo, mat);
        mesh.userData.name = name;
        mesh.visible    = false;  // caché par défaut — LOD gérera
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
    points.push(points[0].clone());

    const geo     = new THREE.BufferGeometry().setFromPoints(points);
    const opacity = cfg.group === 'satellite' ? 0.08 : 0.15;
    const mat     = new THREE.LineBasicMaterial({
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
    const geo       = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
        color: cfg.color, transparent: true, opacity: 0.8
    });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    trailLines[name] = line;
}

// Position interpolée depuis la spline — évite la téléportation
function getSmoothedPosition(name) {
    const spline = splines[name];
    if (!spline) return null;

    // t entre 0 et 1 sur la durée totale
    const t = timeIndex / (maxSteps() - 1);
    return spline.getPoint(t);  // retourne un THREE.Vector3 déjà en unités scène
}

// ── Étoiles ───────────────────────────────────────

function addStars() {
    const count     = 6000;
    const positions = new Float32Array(count * 3);
    const AU        = kmToScene(149_600_000);
    for (let i = 0; i < count; i++) {
        positions[i*3]   = (Math.random() - 0.5) * AU * 600;
        positions[i*3+1] = (Math.random() - 0.5) * AU * 600;
        positions[i*3+2] = (Math.random() - 0.5) * AU * 600;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        color: 0xffffff, size: kmToScene(50_000),
        transparent: true, opacity: 0.8
    });
    scene.add(new THREE.Points(geo, mat));
}

// ── Animation + LOD ───────────────────────────────

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

    // Mettre à jour positions
    for (const name of ['sun', ...bodyNames]) {
        const mesh = bodyMeshes[name];
        if (!mesh) continue;

    // Utilise la spline si disponible, sinon position brute
    const smoothed = getSmoothedPosition(name);
    if (smoothed) {
        mesh.position.copy(smoothed);
    } else {
        const pos = getPosition(name, timeIndex);
        if (!pos) continue;
        mesh.position.copy(posToVec3(pos));
    }
}

    // LOD — visibilité selon distance caméra
    for (const name of bodyNames) {
        const mesh = bodyMeshes[name];
        if (!mesh) continue;

        const distCam   = camera.position.distanceTo(mesh.position);
        const threshold = getVisibilityThreshold(name);
        mesh.visible    = distCam < threshold;

        // Orbite : visible si caméra pas trop loin du corps parent
        if (orbitLines[name]) {
            const cfg = BODY_CONFIG[name];
            if (cfg.group === 'satellite') {
                // Orbite satellite visible seulement en zoom local
                orbitLines[name].visible = distCam < threshold * 3;
            }
        }
    }

    updateTrails();
    updateControls();
    renderer.render(scene, camera);
    updateSidebar();
    updateSimTime();
}

// ── Traînées ─────────────────────────────────────

function updateTrails() {
    for (const name of bodyNames) {
        const line = trailLines[name];
        if (!line) continue;

        const cfg = BODY_CONFIG[name];
        const len = TRAIL_LENGTH[cfg.group] || 0;

        // Position lissée pour la traînée aussi
        const smoothed = getSmoothedPosition(name);
        const v = smoothed || (() => {
            const pos = getPosition(name, timeIndex);
            return pos ? posToVec3(pos) : null;
        })();
        if (!v) continue;

        const hist = trailPoints[name];
        hist.push(v.clone());
        if (hist.length > len) hist.shift();

        const arr = line.geometry.attributes.position.array;
        for (let i = 0; i < hist.length; i++) {
            arr[i*3]   = hist[i].x;
            arr[i*3+1] = hist[i].y;
            arr[i*3+2] = hist[i].z;
        }
        line.geometry.attributes.position.needsUpdate = true;
        line.geometry.setDrawRange(0, hist.length);
        line.material.opacity = (name === selectedBody) ? 1.0 : 0.7;
    }
}

// ── Contrôles caméra ─────────────────────────────

function setupControls() {
    const el = renderer.domElement;
    el.addEventListener('mousedown', e => {
        isMouseDown = true;
        lastMX = e.clientX; lastMY = e.clientY;
    });
    el.addEventListener('mouseup',    () => { isMouseDown = false; });
    el.addEventListener('mouseleave', () => { isMouseDown = false; });
    el.addEventListener('mousemove',  e => {
        if (!isMouseDown) return;
        spherical.theta -= (e.clientX - lastMX) * 0.005;
        spherical.phi    = Math.max(0.05, Math.min(Math.PI - 0.05,
                           spherical.phi + (e.clientY - lastMY) * 0.005));
        lastMX = e.clientX; lastMY = e.clientY;
    });
    el.addEventListener('wheel', e => {
        spherical.radius *= e.deltaY > 0 ? 1.08 : 0.92;
        spherical.radius  = Math.max(1e-6, Math.min(500, spherical.radius));
        e.preventDefault();
    }, { passive: false });
}

function updateControls() {
    if (selectedBody && bodyMeshes[selectedBody]) {
        const target = bodyMeshes[selectedBody].position;
        if (isTransitioning) {
            transitionProgress += 0.05;
            if (transitionProgress >= 1) {
                transitionProgress = 1;
                isTransitioning    = false;
            }
            cameraTarget.lerp(target, transitionProgress);
        } else {
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
    if (isMouseDown) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(Object.values(bodyMeshes));
    if (hits.length > 0)
        selectBody(hits[0].object.userData.name);
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
    camera.aspect   = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

window.addEventListener('load', initThree);