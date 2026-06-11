#ifndef POINT_H
#define POINT_H
#include "vector.h"

typedef struct {
    Vector3 position;
    Vector3 velocity;
    int     time;
} Point;

void point_print(Point p);

#endif