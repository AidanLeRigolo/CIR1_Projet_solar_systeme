#include <stdio.h>
#include "point.h"

void point_print(Point p) {
    printf("t=%d | pos=(%.3e, %.3e, %.3e) | vel=(%.3e, %.3e, %.3e)\n",
        p.time,
        p.position.x, p.position.y, p.position.z,
        p.velocity.x, p.velocity.y, p.velocity.z);
}