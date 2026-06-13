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
            console.log('Loaded:', bodyNames.length, 'bodies');
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