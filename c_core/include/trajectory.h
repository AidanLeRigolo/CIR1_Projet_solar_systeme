#ifndef TRAJECTORY_H
#define TRAJECTORY_H
#include "point.h"

#define TRAJ_CAPACITY_DEFAULT 100000

// list of points on a planet's trajectory
typedef struct {
    char   name[64];
    Point *points;
    int    count;      // number of points in the list
    int    capacity;   // max number of points in the list
} Trajectory;

Trajectory traj_create(const char *name, int capacity);
void       traj_add   (Trajectory *t, Point p);
void       traj_free  (Trajectory *t);
void       traj_print_first(Trajectory *t, int n);
void       traj_test(void);

#endif