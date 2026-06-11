#include <math.h>
#include <stdio.h>
#include "vector.h"

Vector3 vec_add(Vector3 a, Vector3 b) {
    return (Vector3){ a.x + b.x, a.y + b.y, a.z + b.z };
}

Vector3 vec_sub(Vector3 a, Vector3 b) {
    return (Vector3){ a.x - b.x, a.y - b.y, a.z - b.z };
}

Vector3 vec_scale(Vector3 v, double s) {
    return (Vector3){ v.x * s, v.y * s, v.z * s };
}

double vec_norm(Vector3 v) {
    return sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
}

void vec_print(Vector3 v, const char *label) {
    printf("%s : (%.3e, %.3e, %.3e)\n", label, v.x, v.y, v.z);
}

void vec_test(void) {
    printf("=== vec_test ===\n");
    Vector3 a = {1.0, 2.0, 0.0};
    Vector3 b = {3.0, 4.0, 0.0};

    vec_print(vec_add(a, b),   "add");      // attendu : (4, 6, 0)
    vec_print(vec_sub(a, b),   "sub");      // attendu : (-2, -2, 0)
    vec_print(vec_scale(a, 3), "scale*3");  // attendu : (3, 6, 0)
    printf("norm(b) = %.4f\n", vec_norm(b)); // attendu : 5.0000
    printf("================\n");
}