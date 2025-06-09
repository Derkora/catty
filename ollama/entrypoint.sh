#!/bin/sh

# Jalankan ollama di background
ollama serve &

# Tunggu sampai ready
echo "Waiting for Ollama to be ready..."
until curl --silent http://localhost:11434 > /dev/null; do
    echo "Ollama not ready yet. Waiting..."
    sleep 2
done

# Pull model
ollama pull qwen2.5:7b-instruct

# Tunggu proses ollama selesai
wait
