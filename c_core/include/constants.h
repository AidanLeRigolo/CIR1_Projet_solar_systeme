#ifndef CONSTANTS_H
#define CONSTANTS_H

// Source : NASA planetary fact sheets

// ── Physical constants ──────────────────────────────
#define G     6.67408e-11   // gravitational constant (N.m².kg⁻²)
#define M_SUN 1.989e30      // Sun mass (kg)

// ── Planets : mass (kg) ─────────────────────────────
#define M_MERCURY 3.285e23
#define M_VENUS   4.867e24
#define M_EARTH   5.972e24
#define M_MARS    6.390e23
#define M_JUPITER 1.898e27
#define M_SATURN  5.683e26
#define M_URANUS  8.681e25
#define M_NEPTUNE 1.024e26

// ── Planets : perihelion (m) ─────────────────────────
#define PERI_MERCURY 4.600e10
#define PERI_VENUS   1.075e11
#define PERI_EARTH   1.471e11
#define PERI_MARS    2.067e11
#define PERI_JUPITER 7.405e11
#define PERI_SATURN  1.353e12
#define PERI_URANUS  2.742e12
#define PERI_NEPTUNE 4.445e12

// Orbital inclinations relative to ecliptic plane (radians)
#define DEG_TO_RAD   0.017453292519943  // pi / 180

#define INCL_MERCURY (7.005  * DEG_TO_RAD)
#define INCL_VENUS   (3.395  * DEG_TO_RAD)
#define INCL_EARTH   (0.000  * DEG_TO_RAD)  // reference plane
#define INCL_MARS    (1.850  * DEG_TO_RAD)
#define INCL_JUPITER (1.305  * DEG_TO_RAD)
#define INCL_SATURN  (2.485  * DEG_TO_RAD)
#define INCL_URANUS  (0.773  * DEG_TO_RAD)
#define INCL_NEPTUNE (1.770  * DEG_TO_RAD)

// ── Satellites : mass (kg) ───────────────────────────

// Earth
#define M_MOON       7.342e22

// Mars
#define M_PHOBOS     1.066e16
#define M_DEIMOS     1.476e15

// Jupiter (4 lunes galiléennes)
#define M_IO         8.932e22
#define M_EUROPA     4.800e22
#define M_GANYMEDE   1.482e23
#define M_CALLISTO   1.076e23

// Saturn
#define M_TITAN      1.345e23
#define M_RHEA       2.307e21

// Uranus
#define M_TITANIA    3.527e21
#define M_OBERON     3.014e21

// Neptune
#define M_TRITON     2.139e22
#define M_PROTEUS    4.400e19

// ── Satellites : orbit radius from planet center (m) ─

// Orbital periods (seconds)
#define PERIOD_PHOBOS   27553.0      // 7h39 en secondes
#define PERIOD_DEIMOS   109075.0     // 30h18
#define PERIOD_MOON     2360448.0    // 27.3 jours
#define PERIOD_IO       152853.0     // 1.77 jours
#define PERIOD_EUROPA   306822.0     // 3.55 jours
#define PERIOD_TITAN    1377648.0    // 15.9 jours
#define PERIOD_RHEA     390370.0     // 4.5 jours
#define PERIOD_TITANIA  752220.0     // 8.7 jours
#define PERIOD_OBERON   1163220.0    // 13.5 jours
#define PERIOD_TRITON   507772.0     // 5.88 jours
#define PERIOD_PROTEUS  97080.0      // 1.12 jours

// Earth
#define R_MOON       3.844e8

// Mars
#define R_PHOBOS     9.376e6
#define R_DEIMOS     2.346e7

// Jupiter
#define R_IO         4.218e8
#define R_EUROPA     6.711e8
#define R_GANYMEDE   1.070e9
#define R_CALLISTO   1.883e9

// Saturn
#define R_TITAN      1.222e9
#define R_RHEA       5.271e8

// Uranus
#define R_TITANIA    4.363e8
#define R_OBERON     5.835e8

// Neptune
#define R_TRITON     3.548e8
#define R_PROTEUS    1.176e8

// Halley's comet
#define M_HALLEY       2.2e14          // mass (kg)

#define PERI_HALLEY    8.766e10        // perihelion distance (m) — 0.586 AU
#define APHA_HALLEY    2.667e12        // aphelion distance (m)  — 17.8 AU
#define ECC_HALLEY     0.967           // eccentricity

#define INCL_HALLEY  (162.26 * DEG_TO_RAD)  // retrograde orbit
#endif