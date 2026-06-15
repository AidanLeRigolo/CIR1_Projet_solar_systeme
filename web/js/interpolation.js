// interpolation.js
// Interpolation Hermite cubique entre deux points consécutifs
// Utilise les vitesses physiques du JSON — pas de déformation des orbites

// Hermite cubique : p(t) avec t ∈ [0, 1]
// p0, p1 : positions aux extrémités
// v0, v1 : vitesses aux extrémités (dérivées)
// dt     : pas de temps réel en secondes (86400s = 1 jour)
function hermiteInterp(p0, v0, p1, v1, t, dt) {
    const t2 = t * t;
    const t3 = t2 * t;

    // Polynômes de base de Hermite
    const h00 =  2*t3 - 3*t2 + 1;  // base position p0
    const h10 =    t3 - 2*t2 + t;  // base tangente v0
    const h01 = -2*t3 + 3*t2;      // base position p1
    const h11 =    t3 -   t2;      // base tangente v1

    // dt pour convertir vitesse (m/s) en déplacement sur [0,1]
    return {
        x: h00*p0[0] + h10*dt*v0[0] + h01*p1[0] + h11*dt*v1[0],
        y: h00*p0[1] + h10*dt*v0[1] + h01*p1[1] + h11*dt*v1[1],
        z: h00*p0[2] + h10*dt*v0[2] + h01*p1[2] + h11*dt*v1[2],
    };
}

// Retourne la position interpolée pour un corps à un instant continu
// timeFloat : temps en jours (ex: 10.75 = jour 10 + 3/4 de jour)
function getInterpolatedPosition(name, timeFloat) {
    const pts = trajectories[name];
    if (!pts || pts.length < 2) return null;

    // Indices entiers encadrant timeFloat
    const i0 = Math.floor(timeFloat);
    const i1  = Math.min(i0 + 1, pts.length - 1);
    const t   = timeFloat - i0;  // fraction ∈ [0, 1]

    // Si exactement sur un point — pas d'interpolation
    if (t === 0 || i0 === i1) {
        const p = pts[i0][0];
        return new THREE.Vector3(
            metersToScene(p[0]),
            metersToScene(p[2]),
            metersToScene(p[1])
        );
    }

    const p0 = pts[i0][0];   // position au jour i0
    const v0 = pts[i0][1];   // vitesse  au jour i0
    const p1 = pts[i1][0];   // position au jour i1
    const v1 = pts[i1][1];   // vitesse  au jour i1

    // dt = 86400s (1 jour) — pas de temps entre deux points JSON
    const dt = 86400;
    const r  = hermiteInterp(p0, v0, p1, v1, t, dt);

    return new THREE.Vector3(
        metersToScene(r.x),
        metersToScene(r.z),
        metersToScene(r.y)
    );
}