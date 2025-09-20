# AI Search Score - Server

Backend server for the multi-method document search application that combines traditional text search, vector similarity search, and AI-powered semantic search.

## Features

- **Multiple Search Methods**: Traditional text search, vector similarity search, AI-powered semantic search, hybrid search
- **Document Processing**: Markdown file processing, automatic chunking and embedding generation
- **Storage**: SQLite for metadata, LanceDB for vectors, file system monitoring

## Quick Start

1. **Prerequisites**:
   ```bash
   # Install Ollama and pull required models
   ollama pull llama2
   ollama pull all-minilm
   
   # Ensure Node.js 18+ is installed
   node --version
