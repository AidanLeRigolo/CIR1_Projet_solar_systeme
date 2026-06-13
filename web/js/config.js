const BODY_CONFIG = {
    sun:      { color: 0xFDB813, size: 6,   group: 'star'      },
    mercury:  { color: 0xB5B5B5, size: 0.8, group: 'planet'    },
    venus:    { color: 0xE8C47A, size: 1.2, group: 'planet'    },
    earth:    { color: 0x4B9CD3, size: 1.4, group: 'planet'    },
    mars:     { color: 0xC1440E, size: 1.0, group: 'planet'    },
    jupiter:  { color: 0xC88B3A, size: 4.0, group: 'planet'    },
    saturn:   { color: 0xE4D191, size: 3.5, group: 'planet'    },
    uranus:   { color: 0x7DE8E8, size: 2.5, group: 'planet'    },
    neptune:  { color: 0x5B86E5, size: 2.2, group: 'planet'    },
    moon:     { color: 0xAAAAAA, size: 0.4, group: 'satellite'  },
    phobos:   { color: 0xAA8866, size: 0.3, group: 'satellite'  },
    deimos:   { color: 0x998877, size: 0.3, group: 'satellite'  },
    io:       { color: 0xFFCC44, size: 0.5, group: 'satellite'  },
    europa:   { color: 0xCCDDEE, size: 0.5, group: 'satellite'  },
    titan:    { color: 0xDDAA55, size: 0.6, group: 'satellite'  },
    rhea:     { color: 0xBBBBAA, size: 0.4, group: 'satellite'  },
    titania:  { color: 0xAABBCC, size: 0.4, group: 'satellite'  },
    oberon:   { color: 0x998899, size: 0.4, group: 'satellite'  },
    triton:   { color: 0x99BBDD, size: 0.5, group: 'satellite'  },
    proteus:  { color: 0x778899, size: 0.3, group: 'satellite'  },
    halley:   { color: 0x88DDFF, size: 0.5, group: 'comet'      },
};

const G       = 6.67408e-11;
const M_SUN   = 1.989e30;

const BODY_MASSES = {
    mercury: 3.285e23, venus:   4.867e24, earth:   5.972e24,
    mars:    6.390e23, jupiter: 1.898e27, saturn:  5.683e26,
    uranus:  8.681e25, neptune: 1.024e26,
    moon:    7.342e22, phobos:  1.066e16, deimos:  1.476e15,
    io:      8.932e22, europa:  4.800e22, titan:   1.345e23,
    rhea:    2.307e21, titania: 3.527e21, oberon:  3.014e21,
    triton:  2.139e22, proteus: 4.400e19, halley:  2.2e14
};