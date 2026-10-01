# AIPrivateSearch Installer

## Customer Installation Guide

1. Go to **aiprivatesearch.com**, register, and download the AIPS DMG.
2. Open the DMG and install **aiprivatesearch.app**.
3. Run **aiprivatesearch.app** and choose **Install**.
4. The app opens in your browser automatically when complete.

To update later, run **aiprivatesearch.app** and choose **Update**.

## What Gets Installed

The installer will set up:
- **Node.js** (if not already installed)
- **Ollama AI Platform** (for running AI models)
- **Google Chrome** (recommended browser)
- **AIPrivateSearch Application** (complete system)
- **Required AI Models** (qwen2:1.5b, llama3.2:1b)

## Installation Location

- Main application: `/Users/Shared/repos/aiprivatesearch/`

## After Installation

1. **Access the application**: http://localhost:3000
2. **Enter your email** (required for access)
3. **Start searching** with AI-powered document analysis

## Restarting the Application

To restart AIPrivateSearch anytime, run **aiprivatesearch.app** (choose **Update** to also pull the latest version).

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