#ifndef ORBITAL_INIT_H
#define ORBITAL_INIT_H

#include "body.h"
#include "physics.h"

// Initialize a planet at its perihelion around the Sun
void init_planet_at_perihelion(Body *b, double perihelion);

// Initialize a satellite in circular orbit around a parent body
void init_satellite_orbit(Body *b, Body *parent, double orbit_radius);

#endif