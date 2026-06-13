#include <stdio.h>
#include "solar_system.h"
#include "body.h"
#include "orbital_init.h"
#include "physics.h"
#include "json_export.h"
#include "constants.h"

#define DT      1800.0
#define N_STEPS (48 * 365 * 5)
#define SAMPLE  48 //  48 poue un jour

void run_solar_system(const char *output_file) {
    printf("=== Building solar system ===\n");
    printf("dt=%.0fs, steps=%d, sample every %d\n", DT, N_STEPS, SAMPLE);

    Vector3 sun_pos = {0.0, 0.0, 0.0};
    Vector3 zero    = {0.0, 0.0, 0.0};
    int     cap     = N_STEPS + 2;

    // Sun initialized ONCE here
    Body sun = body_create("sun", M_SUN, cap);
    body_init_point(&sun, sun_pos, zero);

    Body mercury = body_create("mercury", M_MERCURY, cap);
    Body venus   = body_create("venus",   M_VENUS,   cap);
    Body earth   = body_create("earth",   M_EARTH,   cap);
    Body mars    = body_create("mars",    M_MARS,    cap);
    Body jupiter = body_create("jupiter", M_JUPITER, cap);
    Body saturn  = body_create("saturn",  M_SATURN,  cap);
    Body uranus  = body_create("uranus",  M_URANUS,  cap);
    Body neptune = body_create("neptune", M_NEPTUNE, cap);

    Body moon    = body_create("moon",    M_MOON,    cap);
    Body phobos  = body_create("phobos",  M_PHOBOS,  cap);
    Body deimos  = body_create("deimos",  M_DEIMOS,  cap);
    Body io      = body_create("io",      M_IO,      cap);
    Body europa  = body_create("europa",  M_EUROPA,  cap);
    Body titan   = body_create("titan",   M_TITAN,   cap);
    Body rhea    = body_create("rhea",    M_RHEA,    cap);
    Body titania = body_create("titania", M_TITANIA, cap);
    Body oberon  = body_create("oberon",  M_OBERON,  cap);
    Body triton  = body_create("triton",  M_TRITON,  cap);
    Body proteus = body_create("proteus", M_PROTEUS, cap);

    // Halley — separate simulation, attracted by Sun only
    int   n_halley = 48 * 365 * 10;
    Body  halley   = body_create("halley", M_HALLEY, n_halley + 2);
    init_elliptic_orbit(&halley, PERI_HALLEY, APHA_HALLEY, INCL_HALLEY);
    Body *sun_ptr  = &sun;
    body_simulate(&halley, &sun_ptr, 1, DT, n_halley, METHOD_RK2_SYMPLECTIC);

    // Initial conditions for planets and satellites
    init_planet_at_perihelion(&mercury, PERI_MERCURY, INCL_MERCURY);
    init_planet_at_perihelion(&venus,   PERI_VENUS,   INCL_VENUS);
    init_planet_at_perihelion(&earth,   PERI_EARTH,   INCL_EARTH);
    init_planet_at_perihelion(&mars,    PERI_MARS,    INCL_MARS);
    init_planet_at_perihelion(&jupiter, PERI_JUPITER, INCL_JUPITER);
    init_planet_at_perihelion(&saturn,  PERI_SATURN,  INCL_SATURN);
    init_planet_at_perihelion(&uranus,  PERI_URANUS,  INCL_URANUS);
    init_planet_at_perihelion(&neptune, PERI_NEPTUNE, INCL_NEPTUNE);

    init_satellite_orbit(&moon,    &earth,   R_MOON);
    init_satellite_orbit(&phobos,  &mars,    R_PHOBOS);
    init_satellite_orbit(&deimos,  &mars,    R_DEIMOS);
    init_satellite_orbit(&io,      &jupiter, R_IO);
    init_satellite_orbit(&europa,  &jupiter, R_EUROPA);
    init_satellite_orbit(&titan,   &saturn,  R_TITAN);
    init_satellite_orbit(&rhea,    &saturn,  R_RHEA);
    init_satellite_orbit(&titania, &uranus,  R_TITANIA);
    init_satellite_orbit(&oberon,  &uranus,  R_OBERON);
    init_satellite_orbit(&triton,  &neptune, R_TRITON);
    init_satellite_orbit(&proteus, &neptune, R_PROTEUS);

    // Main simulation — all planets and satellites together
    // sun(1) + planets(8) + satellites(11) = 20 bodies
    Body *system[] = {
        &sun,
        &mercury, &venus, &earth, &mars,
        &jupiter, &saturn, &uranus, &neptune,
        &moon,
        &phobos, &deimos,
        &io, &europa,
        &titan, &rhea,
        &titania, &oberon,
        &triton, &proteus
    };
    system_simulate(system, 20, DT, N_STEPS, METHOD_RK2_SYMPLECTIC);

    // Export — sun excluded, halley included (20 bodies)
    Body *to_export[] = {
        &mercury, &venus, &earth, &mars,
        &jupiter, &saturn, &uranus, &neptune,
        &moon,
        &phobos, &deimos,
        &io, &europa,
        &titan, &rhea,
        &titania, &oberon,
        &triton, &proteus,
        &halley
    };
    json_export_all_sampled(output_file, to_export, 20, SAMPLE);

    body_free(&sun);
    body_free(&mercury); body_free(&venus);
    body_free(&earth);   body_free(&mars);
    body_free(&jupiter); body_free(&saturn);
    body_free(&uranus);  body_free(&neptune);
    body_free(&moon);
    body_free(&phobos);  body_free(&deimos);
    body_free(&io);      body_free(&europa);
    body_free(&titan);   body_free(&rhea);
    body_free(&titania); body_free(&oberon);
    body_free(&triton);  body_free(&proteus);
    body_free(&halley);

    printf("=== Done ===\n");
}