#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "trajectory.h"

Trajectory traj_create(const char *name, int capacity) {
    Trajectory t;
    strncpy(t.name, name, 63);                            // strncpy pour eviter les depassements 
    t.name[63] = '\0';                                    // caracter de fin forcer
    t.count    = 0;
    t.capacity = capacity;
    t.points   = malloc(sizeof(Point) * capacity);        // liste de point pour la trajectoire
    if (t.points == NULL) {
        fprintf(stderr, "Erreur malloc trajectory\n");
        exit(1);
    }
    return t;
}

void traj_add(Trajectory *t, Point p) {
    if (t->count >= t->capacity) {
        fprintf(stderr, "Trajectoire pleine !\n");
        return;
    }
    t->points[t->count++] = p;
}

void traj_free(Trajectory *t) {
    free(t->points);
    t->points = NULL;
    t->count  = 0;
}

void traj_print_first(Trajectory *t, int n) {
    printf("=== Trajectoire : %s (%d points) ===\n", t->name, t->count);
    for (int i = 0; i < n && i < t->count; i++) {
        point_print(t->points[i]);
    }
}

void traj_test(void){
    Trajectory traj = traj_create("earth-test", 10);

    Point p1 = { {1.47e11, 0.0, 0.0}, {0.0, 3.028e4, 0.0}, 0 };
    Point p2 = { {1.47e11, 2.6e8, 0.0}, {-53.0, 3.028e4, 0.0}, 1 };

    traj_add(&traj, p1);
    traj_add(&traj, p2);

    traj_print_first(&traj, 2);
    traj_free(&traj);
}