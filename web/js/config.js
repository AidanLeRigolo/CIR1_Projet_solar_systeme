const BODY_CONFIG = {
    // color       : couleur hex Three.js
    // radius_km   : rayon reel en km (NASA)
    // group       : star / planet / satellite / comet
    sun:      { color: 0xFDB813, radius_km: 696000,  group: 'star'      },
    mercury:  { color: 0xB5B5B5, radius_km: 2440,    group: 'planet'    },
    venus:    { color: 0xE8C47A, radius_km: 6052,    group: 'planet'    },
    earth:    { color: 0x4B9CD3, radius_km: 6371,    group: 'planet'    },
    mars:     { color: 0xC1440E, radius_km: 3390,    group: 'planet'    },
    jupiter:  { color: 0xC88B3A, radius_km: 71492,   group: 'planet'    },
    saturn:   { color: 0xE4D191, radius_km: 60268,   group: 'planet'    },
    uranus:   { color: 0x7DE8E8, radius_km: 25559,   group: 'planet'    },
    neptune:  { color: 0x5B86E5, radius_km: 24764,   group: 'planet'    },
    moon:     { color: 0xAAAAAA, radius_km: 1737,    group: 'satellite'  },
    phobos:   { color: 0xAA8866, radius_km: 11,      group: 'satellite'  },
    deimos:   { color: 0x998877, radius_km: 6,       group: 'satellite'  },
    io:       { color: 0xFFCC44, radius_km: 1822,    group: 'satellite'  },
    europa:   { color: 0xCCDDEE, radius_km: 1561,    group: 'satellite'  },
    titan:    { color: 0xDDAA55, radius_km: 2576,    group: 'satellite'  },
    rhea:     { color: 0xBBBBAA, radius_km: 764,     group: 'satellite'  },
    titania:  { color: 0xAABBCC, radius_km: 789,     group: 'satellite'  },
    oberon:   { color: 0x998899, radius_km: 761,     group: 'satellite'  },
    triton:   { color: 0x99BBDD, radius_km: 1354,    group: 'satellite'  },
    proteus:  { color: 0x778899, radius_km: 210,     group: 'satellite'  },
    halley:   { color: 0x88DDFF, radius_km: 5,       group: 'comet'      },
};

const G       = 6.67408e-11;
const M_SUN   = 1.989e30;

// Taille visuelle en unites Three.js depuis le rayon reel
// Echelle logarithmique : evite que le soleil soit 100x plus grand
// que la Terre tout en gardant les proportions relatives visibles
// min_size : taille minimale pour rester visible meme en vue systeme
// config.js — tailles de base très petites
function getVisualSize(name) {
    const cfg = BODY_CONFIG[name];
    if (!cfg) return 0.5;

    const log_r   = Math.log10(cfg.radius_km);
    const log_min = Math.log10(5);
    const log_max = Math.log10(696000);
    const t = (log_r - log_min) / (log_max - log_min);

    // Tailles beaucoup plus petites — entre 0.1 et 3 unités
    const size_min = 0.1;
    const size_max = 3.0;
    return size_min + t * (size_max - size_min);
}
const BODY_MASSES = {
    mercury: 3.285e23, venus:   4.867e24, earth:   5.972e24,
    mars:    6.390e23, jupiter: 1.898e27, saturn:  5.683e26,
    uranus:  8.681e25, neptune: 1.024e26,
    moon:    7.342e22, phobos:  1.066e16, deimos:  1.476e15,
    io:      8.932e22, europa:  4.800e22, titan:   1.345e23,
    rhea:    2.307e21, titania: 3.527e21, oberon:  3.014e21,
    triton:  2.139e22, proteus: 4.400e19, halley:  2.2e14
};