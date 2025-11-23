#!/bin/bash
# Fix ref type errors - Change useRef from undefined to null

echo "Fixing ref types..."

# Find all files with useRef<T>() pattern and replace with useRef<T>(null)
find src -name "*.tsx" -type f -exec sed -i '' \
  -e 's/useRef<HTMLDivElement>()/useRef<HTMLDivElement>(null)/g' \
  -e 's/useRef<HTMLInputElement>()/useRef<HTMLInputElement>(null)/g' \
  -e 's/useRef<HTMLTextAreaElement>()/useRef<HTMLTextAreaElement>(null)/g' \
  -e 's/useRef<HTMLVideoElement>()/useRef<HTMLVideoElement>(null)/g' \
  -e 's/useRef<HTMLButtonElement>()/useRef<HTMLButtonElement>(null)/g' \
  {} \;

echo "Ref types fixed!"
