// Échelle linéaire unique : 1 km réel = WORLD_SCALE unités Three.js
// 1 AU = 149 600 000 km → 149.6 unités Three.js
const WORLD_SCALE = 1 / 1_000_000;  // 1 km → 0.000001 unités

function kmToScene(km) {
    return km * WORLD_SCALE;
}

function posToVec3(pos) {
    // pos est en mètres dans le JSON
    // metersToScene convertit mètres → unités Three.js directement
    return new THREE.Vector3(
        metersToScene(pos[0]),
        metersToScene(pos[2]),
        metersToScene(pos[1])
    );
}

function metersToScene(m) {
    // 1 mètre = 1/1000 km = WORLD_SCALE/1000 unités Three.js
    return (m / 1000) * WORLD_SCALE;
}

// Distances de référence en unités Three.js
const AU_SCENE       = kmToScene(149_600_000);   // 149.6 unités
const SUN_RADIUS     = kmToScene(696_000);         // 0.696 unités
const EARTH_RADIUS   = kmToScene(6_371);           // 0.00637 unités
const MOON_ORBIT     = kmToScene(384_400);         // 0.384 unités
const PHOBOS_ORBIT   = kmToScene(9_376);           // 0.00938 unités

function distanceAU(pos) {
    const d = Math.sqrt(pos[0]**2 + pos[1]**2 + pos[2]**2);
    return d / 1.496e11;
}

function formatDistance(pos) {
    const au = distanceAU(pos);
    if (au < 0.01) return (Math.sqrt(pos[0]**2+pos[1]**2+pos[2]**2)/1e3)
                          .toExponential(2) + ' km';
    return au.toFixed(4) + ' AU';
}

function formatVelocity(vel) {
    const v = Math.sqrt(vel[0]**2 + vel[1]**2 + vel[2]**2);
    return (v / 1000).toFixed(2) + ' km/s';
}

function formatEnergy(j) {
    return j.toExponential(3) + ' J';
}