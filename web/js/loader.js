console.log("loader start");

let trajectories = {};
let bodyNames    = [];
let dataLoaded   = false;
let splines = {};

console.log("splines declared"); //debug

function buildSplines() {
    for (const name of bodyNames) {
        const pts = trajectories[name];
        if (!pts || pts.length < 4) continue;

        // Sous-échantillon pour la courbe — 1 point tous les 10
        // pour alléger sans perdre en précision visuelle
        const stride  = Math.max(1, Math.floor(pts.length / 200));
        const points3 = [];

        for (let i = 0; i < pts.length; i += stride) {
            const v = posToVec3(pts[i][0]);
            points3.push(v);
        }

        // CatmullRomCurve3 — interpolation lisse en 3D
        splines[name] = new THREE.CatmullRomCurve3(points3, false, 'catmullrom', 0.5);
    }
    console.log('Splines built for', Object.keys(splines).length, 'bodies');
}

function loadTrajectories(filepath, callback) {
    console.log('Fetching:', filepath);
    
    fetch(filepath)
        .then(r => {
            console.log('Response status:', r.status);
            if (!r.ok) throw new Error('JSON introuvable : ' + filepath);
            return r.json();
        })
        .then(data => {
            trajectories = data;
            bodyNames    = Object.keys(data);
            dataLoaded   = true;
            console.log('Loaded:', bodyNames.length, 'bodies');
            buildSplines();
            callback();
        })
        .catch(err => console.error('Erreur JSON :', err));
}

function getPosition(name, t) {
    if (!trajectories[name]) return null;
    const pts = trajectories[name];
    return pts[Math.min(t, pts.length - 1)][0];
}

function getVelocity(name, t) {
    if (!trajectories[name]) return null;
    const pts = trajectories[name];
    return pts[Math.min(t, pts.length - 1)][1];
}

function maxSteps() {
    if (!dataLoaded || bodyNames.length === 0) return 0;
    // Use shortest trajectory to avoid out-of-bounds
    return Math.min(...bodyNames.map(n => trajectories[n].length));
}