CC = gcc
CFLAGS = -Wall -Wextra -Iinclude
SRC = $(wildcard src/*.c)
OBJ = $(patsubst src/%.c,obj/%.o,$(SRC))

all: bin/kepler.exe

bin/kepler.exe: $(OBJ)
	$(CC) $^ -o $@ -lm

obj/%.o: src/%.c
	@mkdir -p obj bin
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f obj/*.o bin/kepler.exe