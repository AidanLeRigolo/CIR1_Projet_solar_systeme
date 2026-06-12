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

// Core : total acceleration from multiple attractors (superposition)
Vector3 total_acceleration(Vector3  pos_body, Body  **attractors, int  n_attractors);

// Single step for one body given its attractors and chosen method
void body_step(Body *b, Body **attractors, int n_attractors, double dt, SimMethod method);

// Full simulation for one body
void body_simulate(Body *b, Body **attractors, int n_attractors, double dt, int n_steps, SimMethod method);

// System simulation : all bodies attract each other
// Each body is attracted by all other bodies in the system
void system_simulate(Body **bodies, int n_bodies, double dt, int n_steps, SimMethod method);

const char *method_name(SimMethod method);
void physics_test(void);

#endif