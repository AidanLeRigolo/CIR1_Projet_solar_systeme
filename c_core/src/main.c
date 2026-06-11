#include <stdio.h>
#include "vector.h"
#include "trajectory.h"
#include "planet.h" 
#include "physics.h"

int main(void) {
    vec_test();
    traj_test();
    planet_test();
    physics_test();
    
    return 0;
}