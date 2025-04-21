from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered
from marker.config.parser import ConfigParser

# Configuration
config = {
    "output_format": "markdown",
    "disable_image_extraction": "true",
    "use_llm": "true",
    "llm_service": "marker.services.ollama.OllamaService",  # Use the built-in Ollama service
    "ollama_model": "deepseek-r1:1.5b",  # Specify your model
    "ollama_base_url": "http://localhost:11434",  # Default Ollama URL
    "output_dir": "./"
}

# Parse the configuration
config_parser = ConfigParser(config)

# Create a converter
converter = PdfConverter(
    artifact_dict=create_model_dict(),
    config=config_parser.generate_config_dict(),
    processor_list=config_parser.get_processors(),
    renderer=config_parser.get_renderer(),
    llm_service=config_parser.get_llm_service()
)

# Convert a PDF file
rendered = converter("rps.pdf")

# Extract text from the rendered output
text, images = text_from_rendered(rendered)

# Save the extracted text to a Markdown file
output_file_path = "/home/amimir/Documents/zidan/rps.md"
with open(output_file_path, "w", encoding="utf-8") as md_file:
    md_file.write(text)
print(f"Markdown file saved to {output_file_path}")