Install with Apt

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

3. run ollama gpu container
```sh
docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

4. run model
```sh
docker exec -it ollama ollama run deepseek-r1:1.5b
```