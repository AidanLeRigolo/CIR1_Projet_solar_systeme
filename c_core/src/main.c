#include <stdio.h>
#include "vector.h"
#include "trajectory.h"
#include "body.h"
#include "orbital_init.h"
#include "physics.h"
#include "json_export.h"

int main(void) {
    vec_test();
    traj_test();
    physics_test();
    json_test();

    return 0;
}