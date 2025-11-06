/**
 * Sample Header Document
 * 
 * This header file tests code processing capabilities in AIPrivateSearch.
 */

#ifndef SAMPLE_H
#define SAMPLE_H

#include <time.h>

#ifdef __cplusplus
extern "C" {
#endif

// Constants
#define MAX_NAME_LENGTH 100
#define SAMPLE_VERSION "1.0"

// Type definitions
typedef struct {
    char name[MAX_NAME_LENGTH];
    time_t created_at;
    int id;
} SampleStruct;

// Function declarations
SampleStruct* create_sample(const char* name, int id);
void destroy_sample(SampleStruct* sample);
void greet(const SampleStruct* sample);
void print_info(const SampleStruct* sample);
const char* get_version(void);

// Inline functions
static inline int is_valid_sample(const SampleStruct* sample) {
    return (sample != NULL && sample->name[0] != '\0');
}

#ifdef __cplusplus
}
#endif

#endif /* SAMPLE_H */