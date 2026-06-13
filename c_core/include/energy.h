#ifndef ENERGY_H
#define ENERGY_H

#include "body.h"

// Kinetic energy of a body at a given point
// Ec = 1/2 * m * ||v||^2
double kinetic_energy(double mass, Vector3 velocity);

// Gravitational potential energy between two bodies
// Ep = -G * m1 * m2 / r
double potential_energy(double m1, double m2, Vector3 pos1, Vector3 pos2);

// Total mechanical energy of a body relative to all attractors
// E = Ec + sum(Ep for each attractor)
double total_energy(Body *b, Body **attractors, int n_attractors);

// Print energy report for a body at its last point
void energy_print(Body *b, Body **attractors, int n_attractors);

// Check energy conservation over the trajectory
// Prints initial, final, and drift percentage
void energy_check_conservation(Body *b, Body **attractors, int n_attractors);

void energy_test(void);

#endif