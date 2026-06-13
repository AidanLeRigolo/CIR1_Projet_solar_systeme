#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "physics.h"
#include "orbital_init.h"
#include "constants.h"

// ─────────────────────────────────────────────
// CORE
// ─────────────────────────────────────────────

Vector3 compute_acceleration_from(Vector3 pos_body, Vector3 pos_attractor, double  mass_attractor) {
    Vector3 r_vec  = vec_sub(pos_body, pos_attractor);
    double  r      = vec_norm(r_vec);
    double  factor = -(G * mass_attractor) / (r * r * r);
    return vec_scale(r_vec, factor);
}

int compute_substeps(double orbital_period, double dt) {
    // We want dt_substep <= 300s for fast satellites
    // substeps = ceil(dt / 300)
    // For bodies with period > 1 day, 1 substep is enough
    if (orbital_period <= 0)          return 1;
    if (orbital_period > 86400)       return 1;   // > 1 jour : ok
    
    // Pour les orbites rapides : substeps pour avoir dt <= 300s
    int substeps = (int)ceil(dt / 300.0);
    return substeps;
}

Point compute_step(Point current, Body **attractors,
                   int n_attractors, double dt, SimMethod method) {
    Point next;
    next.time = current.time + 1;

    // Reconstruit les tableaux de positions/masses pour total_acceleration
    // depuis les attracteurs
    switch (method) {
        case METHOD_EULER: {
            Vector3 acc     = total_acceleration(current.position,
                                                  attractors, n_attractors);
            next.position   = vec_add(current.position,
                                       vec_scale(current.velocity, dt));
            next.velocity   = vec_add(current.velocity,
                                       vec_scale(acc, dt));
            break;
        }
        case METHOD_EULER_ASYMMETRIC: {
            next.position   = vec_add(current.position,
                                       vec_scale(current.velocity, dt));
            Vector3 acc     = total_acceleration(next.position,
                                                  attractors, n_attractors);
            next.velocity   = vec_add(current.velocity,
                                       vec_scale(acc, dt));
            break;
        }
        case METHOD_RK2: {
            Vector3 k1_r = vec_scale(current.velocity, dt);
            Vector3 k1_v = vec_scale(total_acceleration(current.position,
                                      attractors, n_attractors), dt);
            Vector3 mid_pos = vec_add(current.position,
                                       vec_scale(k1_r, 0.5));
            Vector3 mid_vel = vec_add(current.velocity,
                                       vec_scale(k1_v, 0.5));
            Vector3 k2_r = vec_scale(mid_vel, dt);
            Vector3 k2_v = vec_scale(total_acceleration(mid_pos,
                                      attractors, n_attractors), dt);
            next.position = vec_add(current.position, k2_r);
            next.velocity = vec_add(current.velocity, k2_v);
            break;
        }
        case METHOD_RK2_SYMPLECTIC: {
            Vector3 half_pos = vec_add(current.position,
                                        vec_scale(current.velocity, dt*0.5));
            Vector3 half_acc = total_acceleration(half_pos,
                                                   attractors, n_attractors);
            Vector3 half_vel = vec_add(current.velocity,
                                        vec_scale(half_acc, dt*0.5));
            next.position    = vec_add(half_pos,
                                        vec_scale(half_vel, dt*0.5));
            Vector3 full_acc = total_acceleration(next.position,
                                                   attractors, n_attractors);
            next.velocity    = vec_add(half_vel,
                                        vec_scale(full_acc, dt*0.5));
            break;
        }
        default:
            next = current;
    }
    return next;
}

// Sum of accelerations from all attractors (superposition principle)
Vector3 total_acceleration(Vector3 pos_body, Body  **attractors, int  n_attractors) {
    Vector3 acc = {0.0, 0.0, 0.0};
    for (int i = 0; i < n_attractors; i++) {
        Point last = attractors[i]->trajectory.points[
                         attractors[i]->trajectory.count - 1];
        acc = vec_add(acc, compute_acceleration_from(
                               pos_body, last.position,
                               attractors[i]->mass));
    }
    return acc;
}

// ─────────────────────────────────────────────
// STEP FUNCTIONS (internal)
// ─────────────────────────────────────────────

// acceleration first, (acceleration, position, vitesse)
static void step_euler(Point *cur, Point *next,
                        Body **attractors, int n_attractors, double dt) {
    Vector3 acc     = total_acceleration(cur->position, attractors, n_attractors);
    next->position  = vec_add(cur->position, vec_scale(cur->velocity, dt));
    next->velocity  = vec_add(cur->velocity, vec_scale(acc, dt));
}

// position first, (position, acceleration, vitesse)
static void step_euler_asymmetric(Point *cur, Point *next, Body **attractors, int n_attractors, double dt) {
    // position first
    next->position  = vec_add(cur->position, vec_scale(cur->velocity, dt));
    // acceleration from new position
    Vector3 acc     = total_acceleration(next->position, attractors, n_attractors);
    next->velocity  = vec_add(cur->velocity, vec_scale(acc, dt));
}

// euler methode in 2 steps
static void step_rk2(Point *cur, Point *next, Body **attractors, int n_attractors, double dt) {
    Vector3 k1_r = vec_scale(cur->velocity, dt);
    Vector3 k1_v = vec_scale(total_acceleration(cur->position,
                                                  attractors, n_attractors), dt);

    Vector3 mid_pos = vec_add(cur->position, vec_scale(k1_r, 0.5));
    Vector3 mid_vel = vec_add(cur->velocity,  vec_scale(k1_v, 0.5));

    Vector3 k2_r = vec_scale(mid_vel, dt);
    Vector3 k2_v = vec_scale(total_acceleration(mid_pos,
                                                  attractors, n_attractors), dt);

    next->position = vec_add(cur->position, k2_r);
    next->velocity = vec_add(cur->velocity,  k2_v);
}

// euler symplectic in 2 steps
static void step_rk2_symplectic(Point *cur, Point *next, Body **attractors, int n_attractors, double dt) {
    // half step : position first (asymmetric logic)
    Vector3 half_pos = vec_add(cur->position,
                                vec_scale(cur->velocity, dt * 0.5));
    Vector3 half_acc = total_acceleration(half_pos, attractors, n_attractors);
    Vector3 half_vel = vec_add(cur->velocity,
                                vec_scale(half_acc, dt * 0.5));

    // full step from mid-point : position first (asymmetric logic)
    next->position   = vec_add(half_pos, vec_scale(half_vel, dt * 0.5));
    Vector3 full_acc = total_acceleration(next->position, attractors, n_attractors);
    next->velocity   = vec_add(half_vel, vec_scale(full_acc, dt * 0.5));
}

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

void body_step(Body *b, Body **attractors, int n_attractors, double dt, SimMethod method) {
    Point cur  = b->trajectory.points[b->trajectory.count - 1];
    Point next;
    next.time  = cur.time + 1;

    switch (method) {
        case METHOD_EULER:
            step_euler(&cur, &next, attractors, n_attractors, dt);
            break;
        case METHOD_EULER_ASYMMETRIC:
            step_euler_asymmetric(&cur, &next, attractors, n_attractors, dt);
            break;
        case METHOD_RK2:
            step_rk2(&cur, &next, attractors, n_attractors, dt);
            break;
        case METHOD_RK2_SYMPLECTIC:
            step_rk2_symplectic(&cur, &next, attractors, n_attractors, dt);
            break;
    }

    traj_add(&b->trajectory, next);
}

void body_simulate(Body *b, Body **attractors, int n_attractors,
                   double dt, int n_steps, SimMethod method) {
    for (int i = 0; i < n_steps; i++)
        body_step(b, attractors, n_attractors, dt, method);
    printf("Simulation done (%s) : %s - %d points\n",
           method_name(method), b->name, b->trajectory.count);
}

// System simulation : each body is attracted by all others
// Uses a snapshot of positions at the start of each step
// to avoid using partially-updated positions mid-step
void system_simulate(Body **bodies, int n_bodies, double dt, int n_steps, SimMethod method) {
    for (int step = 0; step < n_steps; step++) {
        for (int i = 0; i < n_bodies; i++) {
            // build attractor list = all bodies except self
            Body **attractors = malloc(sizeof(Body *) * (n_bodies - 1));
            int k  = 0;
            for (int j = 0; j < n_bodies; j++) {
                if (j != i) attractors[k++] = bodies[j];
            }
            body_step(bodies[i], attractors, n_bodies - 1, dt, method);
            free(attractors);
        }
    }
    printf("System simulation done (%s) : %d bodies, %d steps\n",
           method_name(method), n_bodies, n_steps);
}

void system_simulate_adaptive(Body **bodies, int n_bodies, double *periods,
                              double dt, int n_steps, SimMethod method) {
    int *substeps = malloc(sizeof(int) * n_bodies);
    for (int i = 0; i < n_bodies; i++) {
        substeps[i] = periods[i] > 0
                    ? compute_substeps(periods[i], dt)
                    : 1;
        if (substeps[i] > 1)
            printf("  %s : %d substeps (dt_internal=%.0fs)\n",
                   bodies[i]->name, substeps[i], dt / substeps[i]);
    }

    for (int step = 0; step < n_steps; step++) {
        for (int i = 0; i < n_bodies; i++) {
            // Build attractor list
            Body **attractors = malloc(sizeof(Body*) * (n_bodies - 1));
            int k = 0;
            for (int j = 0; j < n_bodies; j++)
                if (j != i) attractors[k++] = bodies[j];

            int    sub  = substeps[i];
            double dt_i = dt / sub;

            // Get current point
            Point current = bodies[i]->trajectory.points[
                                bodies[i]->trajectory.count - 1];

            // Compute sub steps without touching trajectory
            for (int s = 0; s < sub; s++) {
                current = compute_step(current, attractors,
                                        n_bodies - 1, dt_i, method);
            }

            // Add only the final point to trajectory
            traj_add(&bodies[i]->trajectory, current);
            free(attractors);
        }
    }

    free(substeps);
    printf("Adaptive simulation done (%s) : %d bodies, %d steps\n",
           method_name(method), n_bodies, n_steps);
}

void simulate_planet_system(Body *planet,
                             Body **satellites, int n_satellites,
                             Body **attractors_ext, int n_ext,
                             double dt, int n_steps,
                             int substeps, SimMethod method) {
    double dt_i = dt / substeps;

    printf("Coupled integration : %s + %d satellites\n",
           planet->name, n_satellites);
    printf("  dt=%.0fs, substeps=%d, dt_internal=%.0fs\n",
           dt, substeps, dt_i);

    for (int step = 0; step < n_steps; step++) {

        // Current state of planet and satellites
        Point p_cur = planet->trajectory.points[
                          planet->trajectory.count - 1];

        Point *s_cur = malloc(sizeof(Point) * n_satellites);
        for (int i = 0; i < n_satellites; i++) {
            s_cur[i] = satellites[i]->trajectory.points[
                           satellites[i]->trajectory.count - 1];
        }

        // Substeps — planet and satellites move together
        for (int s = 0; s < substeps; s++) {

            // ── Planet attracted by external bodies only ──
            // (satellites mass negligible vs planet)
            Point p_next = compute_step(p_cur, attractors_ext,
                                         n_ext, dt_i, method);

            // ── Each satellite attracted by :
            //    1. Planet (updated position from this substep)
            //    2. External bodies (Sun, etc.)
            for (int i = 0; i < n_satellites; i++) {

                // Build attractor list for this satellite :
                // planet (current substep position) + external bodies
                // We use a temporary Body to pass planet's current position
                Body planet_temp = body_create("_p", planet->mass, 2);
                body_init_point(&planet_temp,
                                 p_cur.position,
                                 p_cur.velocity);

                Body **sat_attractors = malloc(
                    sizeof(Body*) * (n_ext + 1));
                sat_attractors[0] = &planet_temp;
                for (int e = 0; e < n_ext; e++)
                    sat_attractors[e + 1] = attractors_ext[e];

                s_cur[i] = compute_step(s_cur[i], sat_attractors,
                                         n_ext + 1, dt_i, method);

                free(sat_attractors);
                body_free(&planet_temp);
            }

            // Update current state for next substep
            p_cur = p_next;
        }

        // Store final point after all substeps
        traj_add(&planet->trajectory, p_cur);
        for (int i = 0; i < n_satellites; i++)
            traj_add(&satellites[i]->trajectory, s_cur[i]);

        free(s_cur);
    }

    printf("Coupled simulation done : %d steps\n", n_steps);
}

const char *method_name(SimMethod method) {
    switch (method) {
        case METHOD_EULER:            return "euler";
        case METHOD_EULER_ASYMMETRIC: return "euler-asymmetric";
        case METHOD_RK2:              return "rk2";
        case METHOD_RK2_SYMPLECTIC:   return "rk2-symplectic";
        default:                      return "unknown";
    }
}

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

void physics_test(void) {
    printf("=== physics_test ===\n");

    double  dt       = 86400.0;
    int     n_steps  = 365;
    Vector3 sun_pos  = {0.0, 0.0, 0.0};

    // steps_moon doit etre declare avant sun
    double dt_moon    = 3600.0;
    int    steps_moon = 24 * 27;

    Body sun = body_create("sun", M_SUN, steps_moon + 10);
    body_init_point(&sun, sun_pos, (Vector3){0, 0, 0});
    Body *sun_ptr = &sun;

    SimMethod methods[] = {
        METHOD_EULER,
        METHOD_EULER_ASYMMETRIC,
        METHOD_RK2,
        METHOD_RK2_SYMPLECTIC
    };

    // Compare all 4 methods on Earth
    for (int m = 0; m < 4; m++) {
        Body earth = body_create("earth", 5.972e24, n_steps + 10);
        init_planet_at_perihelion(&earth, 1.471e11, INCL_EARTH);
        body_simulate(&earth, &sun_ptr, 1, dt, n_steps, methods[m]);
        printf("[%-20s] last : ", method_name(methods[m]));
        point_print(earth.trajectory.points[earth.trajectory.count - 1]);
        body_free(&earth);
    }

    // Earth + Moon system with RK2 symplectic
    printf("\n[System] Earth + Moon (RK2 symplectic, dt=1h) :\n");

    Body earth = body_create("earth", 5.972e24, steps_moon + 10);
    init_planet_at_perihelion(&earth, 1.471e11, INCL_EARTH);

    Body moon = body_create("moon", 7.342e22, steps_moon + 10);
    init_satellite_orbit(&moon, &earth, 3.844e8);  // plus de earth_pos0

    Body *system[] = {&sun, &earth, &moon};
    system_simulate(system, 3, dt_moon, steps_moon, METHOD_RK2_SYMPLECTIC);

    printf("Earth : ");
    point_print(earth.trajectory.points[earth.trajectory.count - 1]);
    printf("Moon  : ");
    point_print(moon.trajectory.points[moon.trajectory.count - 1]);

    body_free(&earth);
    body_free(&moon);
    body_free(&sun);

    printf("=== test_phobos ===\n");

    double dt_phob      = 300.0; // phobos ne se barre pas la
    int    n_steps_phob = 48 * 600;  // 30 jours

    Body mars   = body_create("mars",   M_MARS,   n_steps_phob + 2);
    Body phobos = body_create("phobos", M_PHOBOS, n_steps_phob + 2);

    Vector3 mars_pos = {PERI_MARS, 0.0, 0.0};
    Vector3 mars_vel = {0.0, sqrt(G * M_SUN / PERI_MARS), 0.0};
    body_init_point(&mars, mars_pos, mars_vel);

    init_satellite_orbit(&phobos, &mars, R_PHOBOS);

    printf("Phobos initial : ");
    point_print(phobos.trajectory.points[0]);

    Body *system_Mars_Phobos[] = {&mars, &phobos};
    system_simulate(system_Mars_Phobos, 2, dt_phob, n_steps_phob, METHOD_RK2_SYMPLECTIC);

    printf("Phobos final : ");
    point_print(phobos.trajectory.points[phobos.trajectory.count - 1]);

    // Distance Mars-Phobos au début et à la fin
    Point mp = mars.trajectory.points[mars.trajectory.count - 1];
    Point pp = phobos.trajectory.points[phobos.trajectory.count - 1];
    Vector3 diff = vec_sub(pp.position, mp.position);
    printf("Distance Mars-Phobos finale : %.3e m (attendu : %.3e m)\n",
           vec_norm(diff), R_PHOBOS);

    body_free(&mars);
    body_free(&phobos);
    printf("====================\n");
}