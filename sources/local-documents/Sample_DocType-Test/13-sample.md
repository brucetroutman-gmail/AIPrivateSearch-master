# 13-sample

```c
/**
 * Sample C Document
 * 
 * This C file tests code processing capabilities in AIPrivateSearch.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

typedef struct {
    char name[100];
    time_t created_at;
} SampleStruct;

SampleStruct* create_sample(const char* name) {
    SampleStruct* sample = malloc(sizeof(SampleStruct));
    if (sample != NULL) {
        strncpy(sample->name, name, sizeof(sample->name) - 1);
        sample->name[sizeof(sample->name) - 1] = '\0';
        sample->created_at = time(NULL);
    }
    return sample;
}

void greet(const SampleStruct* sample) {
    printf("Hello from %s!\n", sample->name);
}

void print_info(const SampleStruct* sample) {
    printf("Name: %s\n", sample->name);
    printf("Created: %s", ctime(&sample->created_at));
    printf("Type: SampleStruct\n");
}

int main() {
    SampleStruct* sample = create_sample("AIPrivateSearch Test");
    if (sample != NULL) {
        greet(sample);
        print_info(sample);
        free(sample);
    }
    return 0;
}
```