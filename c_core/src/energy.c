#include <stdio.h>
#include <math.h>
#include "energy.h"
#include "physics.h"
#include "constants.h"
#include "orbital_init.h"

// Ec = 1/2 * m * ||v||^2
double kinetic_energy(double mass, Vector3 velocity) {
    double v2 = velocity.x * velocity.x
              + velocity.y * velocity.y
              + velocity.z * velocity.z;
    return 0.5 * mass * v2;
}

// Ep = -G * m1 * m2 / ||r1 - r2||
double potential_energy(double m1, double m2,
                         Vector3 pos1, Vector3 pos2) {
    Vector3 r = vec_sub(pos1, pos2);
    double  d = vec_norm(r);
    return -(G * m1 * m2) / d;
}

// E = Ec + sum of Ep with each attractor
double total_energy(Body *b, Body **attractors, int n_attractors) {
    Point last = b->trajectory.points[b->trajectory.count - 1];

    double ec = kinetic_energy(b->mass, last.velocity);

    double ep = 0.0;
    for (int i = 0; i < n_attractors; i++) {
        Point att_last = attractors[i]->trajectory.points[
                             attractors[i]->trajectory.count - 1];
        ep += potential_energy(b->mass, attractors[i]->mass,
                                last.position, att_last.position);
    }

    return ec + ep;
}

void energy_print(Body *b, Body **attractors, int n_attractors) {
    Point last = b->trajectory.points[b->trajectory.count - 1];

    double ec = kinetic_energy(b->mass, last.velocity);
    double ep = 0.0;
    for (int i = 0; i < n_attractors; i++) {
        Point att = attractors[i]->trajectory.points[
                        attractors[i]->trajectory.count - 1];
        ep += potential_energy(b->mass, attractors[i]->mass,
                                last.position, att.position);
    }

    printf("Energy [%s] : Ec=%.4e  Ep=%.4e  E=%.4e J\n",
           b->name, ec, ep, ec + ep);
}

// Compares energy at first and last point of the trajectory
// A stable method should have < 1% drift over the simulation
void energy_check_conservation(Body *b, Body **attractors,
                                int n_attractors) {
    // energy at first point
    Point first = b->trajectory.points[0];
    double ec0  = kinetic_energy(b->mass, first.velocity);
    double ep0  = 0.0;
    for (int i = 0; i < n_attractors; i++) {
        Point att = attractors[i]->trajectory.points[0];
        ep0 += potential_energy(b->mass, attractors[i]->mass,
                                 first.position, att.position);
    }
    double e0 = ec0 + ep0;

    // energy at last point
    Point last = b->trajectory.points[b->trajectory.count - 1];
    double ec1 = kinetic_energy(b->mass, last.velocity);
    double ep1 = 0.0;
    for (int i = 0; i < n_attractors; i++) {
        Point att = attractors[i]->trajectory.points[
                        attractors[i]->trajectory.count - 1];
        ep1 += potential_energy(b->mass, attractors[i]->mass,
                                 last.position, att.position);
    }
    double e1 = ec1 + ep1;

    double drift = fabs((e1 - e0) / e0) * 100.0;

    printf("Conservation [%s] :\n", b->name);
    printf("  E initial : %.6e J\n", e0);
    printf("  E final   : %.6e J\n", e1);
    printf("  Drift     : %.4f %%\n", drift);
}

void energy_test(void) {
    printf("=== energy_test ===\n");

    double  dt     = 86400.0;
    int     n_steps = 365;
    Vector3 sun_pos = {0.0, 0.0, 0.0};

    Body sun = body_create("sun", M_SUN, 2);
    body_init_point(&sun, sun_pos, (Vector3){0, 0, 0});
    Body *sun_ptr = &sun;

    SimMethod methods[] = {
        METHOD_EULER,
        METHOD_EULER_ASYMMETRIC,
        METHOD_RK2,
        METHOD_RK2_SYMPLECTIC
    };

    for (int m = 0; m < 4; m++) {
        Body earth = body_create("earth", M_EARTH, n_steps + 2);
        init_planet_at_perihelion(&earth, PERI_EARTH, INCL_EARTH);
        body_simulate(&earth, &sun_ptr, 1, dt, n_steps, methods[m]);
        energy_check_conservation(&earth, &sun_ptr, 1);
        body_free(&earth);
    }

    body_free(&sun);
    printf("===================\n");
}