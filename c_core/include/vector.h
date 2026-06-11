#ifndef VECTOR_H /* ifndef check if VECTOR_H is already define*/
#define VECTOR_H

// 3D vector
typedef struct {
    double x;
    double y;
    double z;
} Vector3;


// vector operation
Vector3 vec_add   (Vector3 a, Vector3 b);
Vector3 vec_sub   (Vector3 a, Vector3 b);
Vector3 vec_scale (Vector3 v, double s);
double  vec_norm  (Vector3 v);
void    vec_print (Vector3 v, const char *label);
void    vec_test  (void);

#endif