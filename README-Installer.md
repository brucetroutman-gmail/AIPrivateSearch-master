# AIPrivateSearch Installer App

## Customer Installation Guide

### Option 1: Use the Installer App (Recommended)
1. Download `AIPrivateSearch Installer.app`
2. Double-click to run the installer
3. Follow the on-screen prompts
4. The app will automatically open in your browser when complete

### Option 2: Manual Installation
1. Download `load-aiss.command`
2. Move it to `/Users/Shared/`
3. Double-click to run the installer
4. Follow the prompts in Terminal

## What Gets Installed

The installer will set up:
- **Node.js** (if not already installed)
- **Ollama AI Platform** (for running AI models)
- **Google Chrome** (recommended browser)
- **AIPrivateSearch Application** (complete system)
- **Required AI Models** (qwen2:1.5b, llama3.2:1b)

## Installation Location

- Main application: `/Users/Shared/repos/aiprivatesearch/`
- Installer script: `/Users/Shared/load-aiss.command`

## After Installation

1. **Access the application**: http://localhost:3000
2. **Enter your email** (required for access)
3. **Start searching** with AI-powered document analysis

## Restarting the Application

To restart AIPrivateSearch anytime:
1. Navigate to `/Users/Shared/`
2. Double-click `load-aiss.command`

## System Requirements

- **macOS 10.15** or later
- **4GB RAM** minimum (8GB recommended)
- **Internet connection** (for downloads and AI models)
- **5GB free disk space** (for application and models)

## Troubleshooting

- **Port 3000 busy**: Close Terminal windows and restart
- **Models not loading**: Wait for Ollama to finish downloading models
- **Permission errors**: Run installer as administrator if needed

## Support

- **Website**: AIPrivateSearch
- **Documentation**: Check `/Users/Shared/repos/aiprivatesearch/docs/`
- **Logs**: Installation logs saved to `/tmp/aiprivatesearch-install.log`