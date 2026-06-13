#ifndef PHYSICS_H
#define PHYSICS_H
#include "body.h"

#define G     6.67408e-11
#define M_SUN 1.989e30

// Method selector
typedef enum {
    METHOD_EULER,
    METHOD_EULER_ASYMMETRIC,
    METHOD_RK2,
    METHOD_RK2_SYMPLECTIC
} SimMethod;

// Core : acceleration on pos_body from one attractor
Vector3 compute_acceleration_from(Vector3 pos_body, Vector3 pos_attractor, double  mass_attractor);

// Number of substeps for a body based on its orbital period
// Faster orbits need more substeps per global dt
int compute_substeps(double orbital_period, double dt);

// Computes one step on a Point directly without adding to trajectory
Point compute_step(Point current, Body **attractors, int n_attractors, double dt, SimMethod method);

// Core : total acceleration from multiple attractors (superposition)
Vector3 total_acceleration(Vector3  pos_body, Body  **attractors, int  n_attractors);

// Single step for one body given its attractors and chosen method
void body_step(Body *b, Body **attractors, int n_attractors, double dt, SimMethod method);

// Full simulation for one body
void body_simulate(Body *b, Body **attractors, int n_attractors, double dt, int n_steps, SimMethod method);

// System simulation : all bodies attract each other
// Each body is attracted by all other bodies in the system
void system_simulate(Body **bodies, int n_bodies, double dt, int n_steps, SimMethod method);

void system_simulate_adaptive(Body **bodies, int n_bodies, double *periods, double dt, int n_steps, SimMethod method);

// Symplectic coupled integration for a planet and its satellites
// Planet and satellites advance together with substeps
// attractors_ext : external bodies (Sun, other planets) — fixed during substeps
void simulate_planet_system(Body *planet, Body **satellites, int n_satellites,
                            Body **attractors_ext, int n_ext, double dt, int n_steps,
                            int substeps, SimMethod method);

const char *method_name(SimMethod method);
void physics_test(void);

#endif