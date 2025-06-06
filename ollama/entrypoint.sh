#!/bin/sh

sleep 5

# Pull model
ollama pull qwen2.5:7b-instruct
exec ollama serve
