#!/bin/bash
cd /home/kavia/workspace/code-generation/scientific-calculator-web-app-121593-121623/calculator_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

