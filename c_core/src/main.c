#include <stdio.h>
#include "vector.h"
#include "trajectory.h"
#include "body.h"
#include "orbital_init.h"
#include "physics.h"
#include "json_export.h"
#include "solar_system.h"

int main(void) {
    // tests unitaires
    vec_test();
    traj_test();
    physics_test();
    json_test();

    // simulation complete
    run_solar_system("../web/data/trajectoire.json");

    return 0;
}