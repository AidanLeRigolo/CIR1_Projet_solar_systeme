let trajectories = {};
let bodyNames    = [];
let dataLoaded   = false;

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
            console.log('Loaded:', bodyNames.length, 'bodies,',
                        data[bodyNames[0]].length, 'points each');

            // Vérification cohérence Hermite
            checkHermiteCoherence('proteus');
            checkHermiteCoherence('moon');
            checkHermiteCoherence('phobos');

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
    return Math.min(...bodyNames.map(n => trajectories[n].length));
}

// Vérifie la cohérence des unités pour l'interpolation Hermite
// Le ratio tang/dist doit être proche de 1
// Si ratio > 2 : Hermite va osciller (zigzag)
function checkHermiteCoherence(name) {
    const pts = trajectories[name];
    if (!pts || pts.length < 2) {
        console.log(`=== ${name} : pas de données ===`);
        return;
    }

    const dt = 86400;
    let maxRatio    = 0;
    let minRatio    = Infinity;
    let problemIdx  = -1;
    let maxRatioVal = 0;

    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i][0];
        const v0 = pts[i][1];
        const p1 = pts[i+1][0];

        const dx   = p1[0]-p0[0], dy = p1[1]-p0[1], dz = p1[2]-p0[2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

        const vn   = Math.sqrt(v0[0]**2 + v0[1]**2 + v0[2]**2);
        const tang = dt * vn;

        const ratio = tang / Math.max(dist, 1);

        if (ratio > maxRatio) {
            maxRatio    = ratio;
            maxRatioVal = ratio;
            problemIdx  = i;
        }
        if (ratio < minRatio) minRatio = ratio;
    }

    console.log(`=== ${name} ===`);
    console.log(`  ratio min       : ${minRatio.toFixed(3)}`);
    console.log(`  ratio max       : ${maxRatio.toFixed(3)}`);
    console.log(`  segment problématique : index ${problemIdx}`);
    console.log(`  → ${maxRatioVal > 1.8 ? 'OVERSHOOT → lerp activé' : 'OK → Hermite stable'}`);
}