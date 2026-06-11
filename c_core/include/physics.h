#ifndef PHYSICS_H
#define PHYSICS_H

#include "planet.h"

Vector3 compute_acceleration(Vector3 position);

// Euler simple
void euler_step                (Planet *p, double dt);
void simulate_euler            (Planet *p, double dt, int n_steps);

// Euler asymmetric
void euler_asymmetric_step     (Planet *p, double dt);
void simulate_euler_asymmetric (Planet *p, double dt, int n_steps);

// Runge-Kutta 2
void rk2_step                  (Planet *p, double dt);
void simulate_rk2              (Planet *p, double dt, int n_steps);

void physics_test              (void);

#endif