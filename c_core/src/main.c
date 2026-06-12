#include <stdio.h>
#include "vector.h"
#include "trajectory.h"
#include "body.h"
#include "orbital_init.h"
#include "physics.h"

int main(void) {

    vec_test();
    traj_test();
    physics_test();

    return 0;
}