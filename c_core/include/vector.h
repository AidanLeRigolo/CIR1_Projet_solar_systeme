#ifndef VECTOR_H
#define VECTOR_H

typedef struct {
    double x;
    double y;
    double z;
} Vector3;

Vector3 vec_add   (Vector3 a, Vector3 b);
Vector3 vec_sub   (Vector3 a, Vector3 b);
Vector3 vec_scale (Vector3 v, double s);
double  vec_norm  (Vector3 v);
void    vec_print (Vector3 v, const char *label);
void    vec_test  (void);

#endif