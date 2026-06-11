#ifndef PLANET_H
#define PLANET_H

#include "trajectory.h"

// Constantes physiques
#define G        6.67408e-11  // gravitational constant (N.m².kg⁻²)
#define M_SUN    1.989e30     // solar mass (kg)

//  info about the planet and its trajectory
typedef struct {
    char       name[32];
    double     mass;
    double     perihelion;  // minimum distance from the Sun (m)
    Trajectory trajectory;  // list of calculated points
} Planet;

Planet planet_create    (const char *name, double mass, double perihelion, int capacity);
void   planet_init_point(Planet *p);
void   planet_free      (Planet *p);
void   planet_print_info(Planet *p);

#endif