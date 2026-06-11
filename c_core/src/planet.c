#include <stdio.h>
#include <string.h>
#include <math.h>
#include "planet.h"

Planet planet_create(const char *name, double mass, double perihelion, int capacity) {
    Planet p;
    strncpy(p.name, name, 31);                  // strncpy to avoid exceeding
    p.name[31]   = '\0';                        // affects \0 at the end
    p.mass       = mass;
    p.perihelion = perihelion;
    p.trajectory = traj_create(name, capacity);
    return p;
}

void planet_init_point(Planet *p) {
    Point first;

    // Position : at perihelion on the X-axis
    first.position = (Vector3){ p->perihelion, 0.0, 0.0 };

    // Velocity : perpendicular to the radius, on the Y axis
    double v0 = sqrt(G * M_SUN / p->perihelion);
    first.velocity = (Vector3){ 0.0, v0, 0.0 };

    first.time = 0;

    traj_add(&p->trajectory, first);
}

void planet_free(Planet *p) {
    traj_free(&p->trajectory);
}

void planet_print_info(Planet *p) {
    printf("=== Planète : %s ===\n", p->name);
    printf("  masse      : %.3e kg\n", p->mass);
    printf("  périhélie  : %.3e m\n",  p->perihelion);
    printf("  v0         : %.3e m/s\n",
        p->trajectory.points[0].velocity.y);
}