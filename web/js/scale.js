AU_METERS = 1.496e11;

const SCALE = 100 / AU_METERS;

function toScene(meters) {
    return meters * SCALE;
}

function posToVec3(pos) {
    return new THREE.Vector3(
        toScene(pos[0]),
        toScene(pos[2]),
        toScene(pos[1])
    );
}

function distanceAU(pos) {
    const d = Math.sqrt(pos[0]**2 + pos[1]**2 + pos[2]**2);
    return d / AU_METERS;
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