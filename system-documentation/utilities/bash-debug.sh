#!/bin/bash

# This script runs run-aitestr.sh with bash debug mode

# Set the debug options
# -x: Print commands and their arguments as they are executed (without showing comments)
# -v: Print shell input lines as they are read (including comments)

echo "Running run-aitestr.sh with bash debug (commands only)..."
# bash -x ./run-aitestr.sh help
bash -x ./run-aitestr.sh models list

#bash -x ./run-tests-all-models-gen-kno.sh

# Other useful debug options:
# 1. To save the debug output to a file:
# bash -x ./run-aitestr.sh models update 2>&1 | tee debug-output.txt

# 2. To show both commands and input lines (including comments):
# bash -xv ./run-aitestr.sh models update

# 3. To trace functions (shows function entry and exit):
# bash -x -o functrace ./run-aitestr.sh models update

# 4. To trace only specific parts of the script, you can add these lines in the script:
#    set -x  # Start debugging
#    ... code to debug ...
#    set +x  # Stop debugging