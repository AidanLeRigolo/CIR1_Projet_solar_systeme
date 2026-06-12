#include <stdio.h>
#include "json_export.h"

// Write one point in the imposed format :
// [[px, py, pz], [vx, vy, vz], t]
static void write_point(FILE *f, Point *p, int is_last) {
    fprintf(f, "[[%e, %e, %e],[%e, %e, %e], %d]",
        p->position.x, p->position.y, p->position.z,
        p->velocity.x, p->velocity.y, p->velocity.z,
        p->time);

    if (!is_last)
        fprintf(f, ",\n");
    else
        fprintf(f, "\n");
}

// Write one full trajectory :
// "name" : [ [point0], [point1], ... ]
void json_write_trajectory(FILE *f, Trajectory *t, int is_last) {
    fprintf(f, "\"%s\" : [\n", t->name);

    for (int i = 0; i < t->count; i++) {
        fprintf(f, "  ");
        write_point(f, &t->points[i], i == t->count - 1);
    }

    if (!is_last)
        fprintf(f, "],\n");
    else
        fprintf(f, "]\n");
}

// Export all bodies to one JSON file
void json_export_all(const char *filename, Body **bodies, int n_bodies) {
    FILE *f = fopen(filename, "w");
    if (f == NULL) {
        fprintf(stderr, "Error : cannot open file %s\n", filename);
        return;
    }

    fprintf(f, "{\n");
    for (int i = 0; i < n_bodies; i++) {
        json_write_trajectory(f, &bodies[i]->trajectory, i == n_bodies - 1);
    }
    fprintf(f, "}\n");

    fclose(f);
    printf("JSON exported : %s (%d trajectories)\n", filename, n_bodies);
}

// Test : simulate Earth with 4 methods and export to one file
void json_test(void) {
    printf("=== json_test ===\n");

    double  dt      = 86400.0;
    int     n_steps = 365;
    Vector3 sun_pos = {0.0, 0.0, 0.0};

    Body sun = body_create("sun", M_SUN, 2);
    body_init_point(&sun, sun_pos, (Vector3){0, 0, 0});
    Body *sun_ptr = &sun;

    // simulate Earth with all 4 methods
    Body e1 = body_create("earth-euler",            5.972e24, n_steps + 2);
    Body e2 = body_create("earth-euler-asymmetric", 5.972e24, n_steps + 2);
    Body e3 = body_create("earth-rk2",              5.972e24, n_steps + 2);
    Body e4 = body_create("earth-rk2-symplectic",   5.972e24, n_steps + 2);

    init_planet_at_perihelion(&e1, 1.471e11);
    init_planet_at_perihelion(&e2, 1.471e11);
    init_planet_at_perihelion(&e3, 1.471e11);
    init_planet_at_perihelion(&e4, 1.471e11);

    body_simulate(&e1, &sun_ptr, 1, dt, n_steps, METHOD_EULER);
    body_simulate(&e2, &sun_ptr, 1, dt, n_steps, METHOD_EULER_ASYMMETRIC);
    body_simulate(&e3, &sun_ptr, 1, dt, n_steps, METHOD_RK2);
    body_simulate(&e4, &sun_ptr, 1, dt, n_steps, METHOD_RK2_SYMPLECTIC);

    // Moon around Earth (RK2 symplectic, dt=1h)
    double dt_moon    = 3600.0;
    int    steps_moon = 24 * 27 * 13;  // ~13 lunar months = ~1 year

    Body earth_sys = body_create("earth-system", 5.972e24, steps_moon + 2);
    Body moon_sys  = body_create("moon",          7.342e22, steps_moon + 2);
    Body sun_sys   = body_create("sun-system",    M_SUN,    steps_moon + 2);

    body_init_point(&sun_sys, sun_pos, (Vector3){0, 0, 0});
    init_planet_at_perihelion(&earth_sys, 1.471e11);
    init_satellite_orbit(&moon_sys, &earth_sys, 3.844e8);

    Body *system[] = {&sun_sys, &earth_sys, &moon_sys};
    system_simulate(system, 3, dt_moon, steps_moon, METHOD_RK2_SYMPLECTIC);

    // export everything to one file
    Body *all[] = {&e1, &e2, &e3, &e4, &earth_sys, &moon_sys};
    json_export_all("../web/data/trajectoire.json", all, 6);

    body_free(&e1);
    body_free(&e2);
    body_free(&e3);
    body_free(&e4);
    body_free(&earth_sys);
    body_free(&moon_sys);
    body_free(&sun_sys);
    body_free(&sun);

    printf("=================\n");
}