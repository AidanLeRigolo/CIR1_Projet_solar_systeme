#ifndef CONSTANTS_H
#define CONSTANTS_H

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

#endif