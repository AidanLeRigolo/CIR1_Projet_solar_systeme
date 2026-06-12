#include <math.h>
#include "orbital_init.h"

void init_planet_at_perihelion(Body *b, double perihelion, double inclination) {
    Vector3 pos = {perihelion, 0.0, 0.0};
    double  v0  = sqrt(G * M_SUN / perihelion);
    Vector3 vel = {
        0.0,
        v0 * cos(inclination),
        v0 * sin(inclination)
    };
    body_init_point(b, pos, vel);
}

// Elliptic orbit — vis-viva equation
// Placed at perihelion on the X axis
// Velocity perpendicular to radius, rotated by inclination
// For retrograde orbits (inclination > 90 deg) :
//   cos(162 deg) < 0 → velocity Y is negative → orbit goes clockwise
//   this naturally produces a retrograde trajectory
void init_elliptic_orbit(Body *b, double perihelion, double aphelion, double inclination) {
    // position at perihelion
    Vector3 pos = {perihelion, 0.0, 0.0};

    // semi-major axis
    double a  = (perihelion + aphelion) / 2.0;

    // vis-viva : v = sqrt( G * M_SUN * (2/r - 1/a) )
    double v0 = sqrt(G * M_SUN * (2.0 / perihelion - 1.0 / a));

    // velocity rotated by inclination in YZ plane
    Vector3 vel = {
        0.0,
        v0 * cos(inclination),
        v0 * sin(inclination)
    };

    body_init_point(b, pos, vel);
}

void init_satellite_orbit(Body *b, Body *parent, double orbit_radius) {
    Point   parent_point = parent->trajectory.points[
                               parent->trajectory.count - 1];
    Vector3 parent_pos   = parent_point.position;
    Vector3 parent_vel   = parent_point.velocity;

    Vector3 pos = {
        parent_pos.x + orbit_radius,
        parent_pos.y,
        parent_pos.z
    };

    double  v0  = sqrt(G * parent->mass / orbit_radius);
    Vector3 vel = {
        parent_vel.x,
        parent_vel.y + v0,
        parent_vel.z
    };

    body_init_point(b, pos, vel);
}