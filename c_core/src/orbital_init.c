#include <math.h>
#include "orbital_init.h"

// place the planet in the system
void init_planet_at_perihelion(Body *b, double perihelion) {
    Vector3 pos = {perihelion, 0.0, 0.0};

    // circular velocity at perihelion : v = sqrt(G * M_SUN / r)
    double  v0  = sqrt(G * M_SUN / perihelion);
    Vector3 vel = {0.0, v0, 0.0};

    body_init_point(b, pos, vel);
}

// place satellite at the right of the planet
void init_satellite_orbit(Body *b, Body *parent, double orbit_radius) {
    Point parent_point = parent->trajectory.points[parent->trajectory.count - 1];
    Vector3 parent_pos = parent_point.position;
    Vector3 parent_vel = parent_point.velocity;
    Vector3 pos = {parent_pos.x + orbit_radius, parent_pos.y, 0.0};

    double v0 = sqrt(G * parent->mass / orbit_radius);

    Vector3 vel = {parent_vel.x, parent_vel.y + v0, 0.0};

    body_init_point(b, pos, vel);
}