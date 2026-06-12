#include <stdio.h>
#include <string.h>
#include "body.h"

Body body_create(const char *name, double mass, int capacity) {
    Body b;
    strncpy(b.name, name, 63);
    b.name[63] = '\0';
    b.mass     = mass;
    b.trajectory = traj_create(name, capacity);
    return b;
}

// pos and vel are given directly - the caller computes them
void body_init_point(Body *b, Vector3 pos, Vector3 vel) {
    Point first;
    first.position = pos;
    first.velocity = vel;
    first.time     = 0;
    traj_add(&b->trajectory, first);
}

void body_free(Body *b) {
    traj_free(&b->trajectory);
}

void body_print_info(Body *b) {
    printf("=== Body : %s ===\n", b->name);
    printf("  mass : %.3e kg\n", b->mass);
    if (b->trajectory.count > 0) {
        printf("  initial pos : ");
        vec_print(b->trajectory.points[0].position, "pos");
        printf("  initial vel : ");
        vec_print(b->trajectory.points[0].velocity, "vel");
    }
}