## Im testing smallmodels I have llama, phi and granite. Can you suggest some more.

Answer

Here are some excellent small language models you should consider testing alongside Llama, Phi, and Granite:


Open Source Options:

Qwen2.5 (0.5B, 1.5B, 3B) - Strong performance across multiple languages
Gemma 2 (2B, 9B) - Google's efficient models with good reasoning
SmolLM (135M, 360M, 1.7B) - Hugging Face's compact models
TinyLlama (1.1B) - Very lightweight, good for resource-constrained environments
StableLM (1.6B, 3B) - Stability AI's efficient models
OLMo (1B, 7B) - Allen Institute's fully open model
OpenELM (270M, 450M, 1.1B, 3B) - Apple's efficient language models

Specialized Small Models:

CodeQwen (1.5B) - Code-focused variant
Phi-3.5-mini - Latest version if you haven't tried it
MobileLLM (125M, 350M) - Optimized for mobile devices
H2O-Danube (1.8B) - Good performance-to-size ratio

What's your primary use case?

Are you testing for:


General chat/reasoning?
Code generation?
Specific domains?
Resource constraints (memory/compute)?

This would help me suggest the most relevant models for your testing scenario.


## Genral local model info, Document searches, Internet searches

Answer

For your use cases (general info, document searches, internet searches), here are the best small models to test:


Top Recommendations:

Qwen2.5-3B/7B - Excellent for:


General knowledge and reasoning
Document understanding and search
Strong multilingual capabilities
Good instruction following

Gemma 2-2B/9B - Great for:


Factual information retrieval
Document analysis
Web search query understanding
Reliable outputs with less hallucination

Phi-3.5-mini (3.8B) - Strong at:


Reasoning through complex queries
Summarizing documents
Understanding search intent

Specialized for Your Use Cases:

BGE-M3 (Small embedding model) - For document search:


Excellent for semantic document retrieval
Works well with RAG systems
Multilingual document understanding

Nomic-Embed-Text - Another embedding option:


Good for local document indexing
Fast similarity search

Setup Suggestions:

For document searches: Consider pairing a small LLM with a dedicated embedding model for better retrieval.


For internet searches: Models like Qwen2.5 and Gemma 2 are better at understanding search queries and synthesizing web information.


Which framework are you using? (Ollama, llama.cpp, transformers, etc.) This affects which models are easiest to deploy locally.


Would you like specific guidance on setting up any of these for your particular workflow?

Related

## Im using Ollama on Mac Silicon hardware all AI processing is local.

Answer

Perfect! Ollama on Apple Silicon is an excellent setup. Here are the best small models available on Ollama for your use cases:


Highly Recommended for Ollama:

qwen2.5:3b or qwen2.5:7b
Excellent general knowledge and reasoning
Great for document analysis
Fast on Apple Silicon

gemma2:2b or gemma2:9b
Very reliable for factual information
Good at understanding search queries
Less prone to hallucination

phi3.5:3.8b
Strong reasoning capabilities
Good for complex document questions

Also Worth Testing:

llama3.2:3b
Latest Llama variant, good general performance


qwen2.5-coder:1.5b
Surprisingly good for general tasks despite being code-focused

mistral:7b
Solid all-around performer

Performance Tips for Mac Silicon:

7B models run well on M1/M2 with 16GB+ RAM
3B models are very fast and still capable
Use ollama run <model> to test interactively
Check ollama ps to see memory usage

Which Mac Silicon chip and RAM do you have? This will help determine the optimal model sizes for your setup.

Related






