# Path: build/docker/entrypoint.sh

#!/bin/sh
set -e

echo "Starting Javaspectre spectral engine..."
node src/cli/javaspectre.js "$@"
