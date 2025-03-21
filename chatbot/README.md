# Install Container GPU
1. Configure the repository
```sh
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
    | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
    | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
    | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update
```
Install the NVIDIA Container Toolkit packages
```sh
sudo apt-get install -y nvidia-container-toolkit
```
2. Configure Docker to use Nvidia driver
```sh
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

3. Buat network
```sh
docker network create ai-network
```

4. run ollama gpu container
```sh
docker run -d --gpus=all \
  --network ai-network \
  -v ollama-data:/root/.ollama \
  -p 11434:11434 \
  --name ollama \
  --restart=unless-stopped  \
  ollama/ollama
```

4. run model
```sh
docker exec -it ollama ollama run deepseek-r1:32b
```

# RUN MODEL
```sh
sudo docker compose up -d
```