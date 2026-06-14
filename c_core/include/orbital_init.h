#ifndef ORBITAL_INIT_H
#define ORBITAL_INIT_H

#include "body.h"
#include "physics.h"

// Initialize a planet at perihelion with vis-viva velocity
// Works for any eccentricity including circular (ecc=0)
void init_planet_at_perihelion(Body *b, double perihelion, double eccentricity, double inclination);

// Initialize a body on an elliptical orbit using the vis-viva equation
// v = sqrt( G * M_SUN * (2/r - 1/a) )
// perihelion  : closest point to Sun (m)
// aphelion    : farthest point from Sun (m)
// inclination : angle relative to ecliptic plane (radians)
void init_elliptic_orbit(Body *b, double perihelion, double aphelion, double inclination);

// Initialize a satellite in circular orbit around a parent body
void init_satellite_orbit(Body *b, Body *parent, double orbit_radius);

#endif