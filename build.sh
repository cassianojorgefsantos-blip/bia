#!/bin/bash
set -e

ECR_REGISTRY="087470308519.dkr.ecr.us-east-1.amazonaws.com"
VITE_API_URL="${VITE_API_URL:-http://localhost:8080}"

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
docker build --build-arg VITE_API_URL=$VITE_API_URL -t bia .
docker tag bia:latest $ECR_REGISTRY/bia:latest
docker push $ECR_REGISTRY/bia:latest
