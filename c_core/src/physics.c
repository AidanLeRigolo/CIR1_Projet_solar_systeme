#include <stdio.h>
#include <math.h>
#include "physics.h"

// Gravitational acceleration toward the Sun (fixed at origin)
// Formula : a = -(G * M_SUN / ||r||^3) * r
Vector3 compute_acceleration(Vector3 position) {
    double r      = vec_norm(position);
    double factor = -(G * M_SUN) / (r * r * r);
    return vec_scale(position, factor);
}

// Euler method : computes next position and velocity from current point
// 1. acceleration from current position
// 2. new position : r(t+1) = r(t) + v(t) * dt
// 3. new velocity : v(t+1) = v(t) + a(t) * dt
void euler_step(Planet *p, double dt) {
    Point current = p->trajectory.points[p->trajectory.count - 1];

    Vector3 acc     = compute_acceleration(current.position);
    Vector3 new_pos = vec_add(current.position, vec_scale(current.velocity, dt));
    Vector3 new_vel = vec_add(current.velocity, vec_scale(acc, dt));

    Point next;
    next.position = new_pos;
    next.velocity = new_vel;
    next.time     = current.time + 1;

    traj_add(&p->trajectory, next);
}

// Runs the full simulation for n_steps time steps
void simulate_euler(Planet *p, double dt, int n_steps) {
    for (int i = 0; i < n_steps; i++) {
        euler_step(p, dt);
    }
    printf("Simulation done : %d points\n", p->trajectory.count);
}

// Asymmetric Euler method - more stable than simple Euler
// Inverted order compared to simple Euler :
// 1. new position : r(t+1) = r(t) + v(t) * dt
// 2. acceleration from the NEW position
// 3. new velocity : v(t+1) = v(t) + a(t+1) * dt
void euler_asymmetric_step(Planet *p, double dt) {
    Point current = p->trajectory.points[p->trajectory.count - 1];

    // step 1 : position first
    Vector3 new_pos = vec_add(current.position, vec_scale(current.velocity, dt));

    // step 2 : acceleration from the new position
    Vector3 acc     = compute_acceleration(new_pos);

    // step 3 : velocity from the new acceleration
    Vector3 new_vel = vec_add(current.velocity, vec_scale(acc, dt));

    Point next;
    next.position = new_pos;
    next.velocity = new_vel;
    next.time     = current.time + 1;

    traj_add(&p->trajectory, next);
}

void simulate_euler_asymmetric(Planet *p, double dt, int n_steps) {
    for (int i = 0; i < n_steps; i++) {
        euler_asymmetric_step(p, dt);
    }
    printf("Simulation done (asymmetric euler) : %d points\n", p->trajectory.count);
}

// Runge-Kutta order 2
// Splits the time step in two to get a better derivative estimate
// k1 : derivative at current point
// k2 : derivative at midpoint using k1
// Equations 19-24 from the project subject
void rk2_step(Planet *p, double dt) {
    Point current = p->trajectory.points[p->trajectory.count - 1];

    // k1 : slope at current point
    Vector3 k1_r = vec_scale(current.velocity, dt);
    Vector3 k1_v = vec_scale(compute_acceleration(current.position), dt);

    // midpoint position and velocity
    Vector3 mid_pos = vec_add(current.position, vec_scale(k1_r, 0.5));
    Vector3 mid_vel = vec_add(current.velocity, vec_scale(k1_v, 0.5));

    // k2 : slope at midpoint
    Vector3 k2_r = vec_scale(mid_vel, dt);
    Vector3 k2_v = vec_scale(compute_acceleration(mid_pos), dt);

    // new position and velocity using k2
    Point next;
    next.position = vec_add(current.position, k2_r);
    next.velocity = vec_add(current.velocity, k2_v);
    next.time     = current.time + 1;

    traj_add(&p->trajectory, next);
}

void simulate_rk2(Planet *p, double dt, int n_steps) {
    for (int i = 0; i < n_steps; i++) {
        rk2_step(p, dt);
    }
    printf("Simulation done (RK2) : %d points\n", p->trajectory.count);
}

void physics_test(void) {
    printf("=== physics_test ===\n");

    double dt      = 86400.0;  // 1 day in seconds
    int    n_steps = 365;

    // --- Euler simple ---
    Planet e1 = planet_create("earth-euler", 5.972e24, 1.471e11, n_steps + 10);
    planet_init_point(&e1);
    simulate_euler(&e1, dt, n_steps);
    printf("[Euler]      last point : ");
    point_print(e1.trajectory.points[e1.trajectory.count - 1]);
    planet_free(&e1);

    // --- Euler asymmetric ---
    Planet e2 = planet_create("earth-asym", 5.972e24, 1.471e11, n_steps + 10);
    planet_init_point(&e2);
    simulate_euler_asymmetric(&e2, dt, n_steps);
    printf("[Asym Euler] last point : ");
    point_print(e2.trajectory.points[e2.trajectory.count - 1]);
    planet_free(&e2);

    // --- RK2 ---
    Planet e3 = planet_create("earth-rk2", 5.972e24, 1.471e11, n_steps + 10);
    planet_init_point(&e3);
    simulate_rk2(&e3, dt, n_steps);
    printf("[RK2]        last point : ");
    point_print(e3.trajectory.points[e3.trajectory.count - 1]);
    planet_free(&e3);

    printf("====================\n");
}