#include <stdio.h>
#include "json_export.h"

#include "constants.h" // correction a revoir
#include "physics.h"
#include "orbital_init.h"

static void write_point(FILE *f, Point *p, int is_last) {
    fprintf(f, "  [[%e, %e, %e],[%e, %e, %e], %d]",
        p->position.x, p->position.y, p->position.z,
        p->velocity.x, p->velocity.y, p->velocity.z,
        p->time);
    fprintf(f, is_last ? "\n" : ",\n");
}

void json_write_trajectory_sampled(FILE *f, Trajectory *t, int sample_every, int is_last) {
    fprintf(f, "\"%s\" : [\n", t->name);

    // count how many points will actually be written
    int written = 0;
    int total   = 0;
    for (int i = 0; i < t->count; i += sample_every)
        total++;

    for (int i = 0; i < t->count; i += sample_every) {
        written++;
        write_point(f, &t->points[i], written == total);
    }

    fprintf(f, is_last ? "]\n" : "],\n");
    printf("  %s : %d points written (1 every %d)\n",
           t->name, written, sample_every);
}

// export in CIR1_Projet/web/data
void json_export_all_sampled(const char *filename, Body **bodies, int n_bodies, int sample_every) {
    FILE *f = fopen(filename, "w");
    if (f == NULL) {
        fprintf(stderr, "Error : cannot open file %s\n", filename);
        return;
    }

    printf("Exporting to %s (sample every %d points)...\n", filename, sample_every);

    fprintf(f, "{\n");
    for (int i = 0; i < n_bodies; i++) {
        json_write_trajectory_sampled(f, &bodies[i]->trajectory, sample_every, i == n_bodies - 1);
    }
    fprintf(f, "}\n");

    fclose(f);
    printf("JSON export done : %s\n", filename);
}

void json_test(void) {
    printf("=== json_test ===\n");

    double  dt      = 1800.0;
    int     n_steps = 48 * 365;   // 1 year at 30-min steps
    Vector3 sun_pos = {0.0, 0.0, 0.0};

    Body sun   = body_create("sun",   M_SUN,   n_steps + 2);
    Body earth = body_create("earth", M_EARTH, n_steps + 2);
    Body moon  = body_create("moon",  M_MOON,  n_steps + 2);

    body_init_point(&sun, sun_pos, (Vector3){0, 0, 0});
    init_planet_at_perihelion(&earth, PERI_EARTH, INCL_EARTH);
    init_satellite_orbit(&moon, &earth, R_MOON);

    Body *system[] = {&sun, &earth, &moon};
    system_simulate(system, 3, dt, n_steps, METHOD_RK2_SYMPLECTIC);

    // sample_every=48 → 1 point per day in the JSON
    Body *export[] = {&earth, &moon};
    json_export_all_sampled("../web/data/trajectoire.json",
                             export, 2, 48);

    body_free(&sun);
    body_free(&earth);
    body_free(&moon);

    printf("=================\n");
}