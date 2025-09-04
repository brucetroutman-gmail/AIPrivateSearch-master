#!/bin/bash
cd /Users/Shared
curl -O https://raw.githubusercontent.com/brucetroutman-gmail/AISearchScore-master/main/load-aiss.sh 2>/dev/null || echo "Using local script"
bash load-aiss.sh