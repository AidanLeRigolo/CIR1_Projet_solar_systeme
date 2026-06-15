const BODY_CONFIG = {
    sun:      { color: 0xFDB813, radius_km: 696_000,  group: 'star'      },
    mercury:  { color: 0xB5B5B5, radius_km: 2_440,    group: 'planet'    },
    venus:    { color: 0xE8C47A, radius_km: 6_052,    group: 'planet'    },
    earth:    { color: 0x4B9CD3, radius_km: 6_371,    group: 'planet'    },
    mars:     { color: 0xC1440E, radius_km: 3_390,    group: 'planet'    },
    jupiter:  { color: 0xC88B3A, radius_km: 71_492,   group: 'planet'    },
    saturn:   { color: 0xE4D191, radius_km: 60_268,   group: 'planet'    },
    uranus:   { color: 0x7DE8E8, radius_km: 25_559,   group: 'planet'    },
    neptune:  { color: 0x5B86E5, radius_km: 24_764,   group: 'planet'    },
    moon:     { color: 0xAAAAAA, radius_km: 1_737,    group: 'satellite'  },
    phobos:   { color: 0xAA8866, radius_km: 11,       group: 'satellite'  },
    deimos:   { color: 0x998877, radius_km: 6,        group: 'satellite'  },
    io:       { color: 0xFFCC44, radius_km: 1_822,    group: 'satellite'  },
    europa:   { color: 0xCCDDEE, radius_km: 1_561,    group: 'satellite'  },
    titan:    { color: 0xDDAA55, radius_km: 2_576,    group: 'satellite'  },
    rhea:     { color: 0xBBBBAA, radius_km: 764,      group: 'satellite'  },
    titania:  { color: 0xAABBCC, radius_km: 789,      group: 'satellite'  },
    oberon:   { color: 0x998899, radius_km: 761,      group: 'satellite'  },
    triton:   { color: 0x99BBDD, radius_km: 1_354,    group: 'satellite'  },
    proteus:  { color: 0x778899, radius_km: 210,      group: 'satellite'  },
    halley:   { color: 0x88DDFF, radius_km: 5,        group: 'comet'      },
};

const G         = 6.67408e-11;
const M_SUN     = 1.989e30;

const BODY_MASSES = {
    mercury: 3.285e23, venus:   4.867e24, earth:   5.972e24,
    mars:    6.390e23, jupiter: 1.898e27, saturn:  5.683e26,
    uranus:  8.681e25, neptune: 1.024e26,
    moon:    7.342e22, phobos:  1.066e16, deimos:  1.476e15,
    io:      8.932e22, europa:  4.800e22, titan:   1.345e23,
    rhea:    2.307e21, titania: 3.527e21, oberon:  3.014e21,
    triton:  2.139e22, proteus: 4.400e19, halley:  2.2e14
};

// Taille en unités Three.js — échelle linéaire pure
function getBodySize(name) {
    const cfg = BODY_CONFIG[name];
    if (!cfg) return 0.001;
    return kmToScene(cfg.radius_km);
}

function kmToScene(km) {
    return km * WORLD_SCALE;
}

// Seuil de distance caméra pour afficher le mesh
// En dessous = visible, au dessus = seulement trail/orbite
function getVisibilityThreshold(name) {
    const cfg = BODY_CONFIG[name];
    if (!cfg) return 1;
    // Visible quand la caméra est à moins de 500 rayons du corps
    return getBodySize(name) * 500;
}