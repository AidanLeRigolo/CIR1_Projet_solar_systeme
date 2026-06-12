#ifndef JSON_EXPORT_H
#define JSON_EXPORT_H
#include <stdio.h>
#include "body.h"

// Write one trajectory to an open file
// is_last : 1 if this is the last trajectory (no trailing comma)
void json_write_trajectory(FILE *f, Trajectory *t, int is_last);

// Export all bodies to a single JSON file
// bodies   : array of Body pointers
// n_bodies : number of bodies
// filename : output file path (ex: "../web/data/trajectoire.json")
void json_export_all(const char *filename, Body **bodies, int n_bodies);

void json_test(void);

#endif