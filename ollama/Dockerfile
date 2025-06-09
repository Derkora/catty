FROM ollama/ollama

# Install curl (atau wget jika kamu mau)
RUN apt-get update && apt-get install -y curl

# Copy script startup-mu
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
