CC = gcc
CFLAGS = -Wall -Wextra -Iinclude          # warning + tout les .h de include/
SRC = $(wildcard src/*.c)                 # tout les .c de src/
OBJ = $(patsubst src/%.c,obj/%.o,$(SRC))  # tout les .o de obj/ creer par SRC

all: bin/kepler.exe

bin/kepler.exe: $(OBJ)
	$(CC) $^ -o $@ -lm                    # $^ -> OBJ, $@ -> nom de la cible

obj/%.o: src/%.c
	@mkdir -p obj bin                     # creer les fichier si il exite pas
	$(CC) $(CFLAGS) -c $< -o $@           # $< -> premier ligne de la dependance

clean:
	rm -f obj/*.o bin/kepler.exe