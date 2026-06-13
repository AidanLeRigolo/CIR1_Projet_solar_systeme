const AU = 1.496e11;

// 1 AU = 100 Three.js units
const SCALE = 100 / AU;

function toScene(meters) {
    return meters * SCALE;
}

function posToVec3(pos) {
    return new THREE.Vector3(
        toScene(pos[0]),
        toScene(pos[2]),   // Z physique → Y Three.js (axe vertical)
        toScene(pos[1])    // Y physique → Z Three.js
    );
}

function distanceAU(pos) {
    const d = Math.sqrt(pos[0]**2 + pos[1]**2 + pos[2]**2);
    return d / AU;
}

function velocityKms(vel) {
    return Math.sqrt(vel[0]**2 + vel[1]**2 + vel[2]**2) / 1000;
}

function formatDistance(pos) {
    const au = distanceAU(pos);
    if (au < 0.1) return (au * 1.496e8).toFixed(0) + ' km';
    return au.toFixed(4) + ' AU';
}

function formatVelocity(vel) {
    return velocityKms(vel).toFixed(2) + ' km/s';
}

function formatEnergy(j) {
    return j.toExponential(3) + ' J';
}