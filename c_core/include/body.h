#ifndef BODY_H
#define BODY_H
#include "trajectory.h"

// Generic celestial body - works for planets, satellites, anything
typedef struct {
    char       name[64];
    double     mass;
    Trajectory trajectory;
} Body;

Body body_create    (const char *name, double mass, int capacity);
void body_init_point(Body *b, Vector3 pos, Vector3 vel);
void body_free      (Body *b);
void body_print_info(Body *b);

#endif