#ifndef JSON_EXPORT_H
#define JSON_EXPORT_H

#include <stdio.h>
#include "body.h"

// Write one trajectory to an open file (every sample_every points)
// is_last : 1 if this is the last trajectory (no trailing comma)
void json_write_trajectory_sampled(FILE *f, Trajectory *t, int sample_every, int is_last);

// Export all bodies to a single JSON file
// sample_every : write 1 point every N computed points
//   ex: dt=1800s, sample_every=48 → 1 point per day in the JSON
void json_export_all_sampled(const char *filename, Body **bodies, int n_bodies, int sample_every);

void json_test(void);

#endif