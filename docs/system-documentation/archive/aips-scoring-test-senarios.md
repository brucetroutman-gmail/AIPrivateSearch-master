High Score Tests (Expected: 3-3-3 = 100%)
Perfect Factual Questions
Query: "What is the capital of France?"

Expected Response: "Paris is the capital of France."

Why: Simple, verifiable fact with clear, direct answer

Well-Structured Explanations
Query: "Explain photosynthesis in plants"

Expected: Accurate scientific process, relevant to query, well-organized steps

Tests: All three criteria at maximum level

Medium Score Tests (Expected: 2-2-2 = 67%)
Partially Accurate Information
Query: "When was the iPhone first released?"

Problematic Response: "The iPhone was released in 2008 by Apple and revolutionized smartphones."

Issues: Wrong year (2007), but otherwise accurate and relevant

Somewhat Relevant Answers
Query: "How do I bake chocolate chip cookies?"

Problematic Response: "Baking is a great hobby. Cookies need flour, sugar, and chocolate chips. Heat is important."

Issues: Relevant but lacks specific instructions, poorly organized

Low Score Tests (Expected: 1-1-1 = 33%)
Completely Inaccurate
Query: "What is 2 + 2?"

Bad Response: "2 + 2 equals 5. This is basic mathematics."

Issues: Factually wrong, confident in error

Off-Topic Responses
Query: "How do I change a tire?"

Bad Response: "Tires are made of rubber. The automotive industry is fascinating. Cars have evolved significantly."

Issues: Doesn't answer the question, irrelevant tangents

Poorly Organized
Query: "What are the symptoms of the flu?"

Bad Response: "Fever sometimes. People get sick. Headaches and body aches. Maybe nausea. Winter is flu season. Rest helps."

Issues: Disorganized, fragmented, hard to follow

Edge Case Tests
Mixed Quality (Expected: 3-1-2 = 61%)
Query: "Explain quantum physics"

Response: "Quantum physics deals with subatomic particles and their behavior, including wave-particle duality and uncertainty principles. However, let me tell you about my favorite pizza toppings. The mathematical formulations are complex."

Scoring: Accurate start (3), goes off-topic (1), somewhat organized (2)

Accurate but Irrelevant (Expected: 3-1-3 = 56%)
Query: "How do I fix a leaky faucet?"

Response: "The molecular structure of water is H2O, consisting of two hydrogen atoms and one oxygen atom. This creates a polar molecule with unique properties."

Scoring: Accurate (3), irrelevant (1), well-organized (3)

Relevant but Inaccurate (Expected: 1-3-2 = 44%)
Query: "What's the fastest land animal?"

Response: "The fastest land animal is the lion, which can run up to 200 mph when hunting prey in the African savanna."

Scoring: Wrong animal and speed (1), directly answers question (3), clear structure (2)

Stress Tests
Ambiguous Queries
Query: "What's the best?"

Tests: How system handles vague questions

Complex Multi-Part Questions
Query: "Compare democracy and monarchy, explain their historical origins, and predict future trends"

Tests: Comprehensive evaluation across all criteria

Controversial Topics
Query: "Is climate change real?"

Tests: Factual accuracy vs. opinion handling

These test cases will help validate that your scoring system properly differentiates between high-quality, medium-quality, and poor responses across all three weighted criteria.

