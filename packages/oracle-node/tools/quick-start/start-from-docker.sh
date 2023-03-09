#!/usr/bin/bash

set -x # to print commands as they are executed

# Running oracle node
docker run --env-file quick-start.env -it public.ecr.aws/y7v2w8b2/redstone-oracle-node:fef6d9b
