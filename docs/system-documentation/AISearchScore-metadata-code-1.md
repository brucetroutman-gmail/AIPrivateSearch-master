import fs from 'fs';
import natural from 'natural';

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

// Function to generate metadata from a document
function generateMetadata(documentText) {
  // Clean and tokenize the text
  const sentences = documentText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const tokens = tokenizer.tokenize(documentText.toLowerCase());

  // Generate summary (first 3 sentences or 100 words, whichever is shorter)
  const summaryWords = sentences.slice(0, 3).join('. ').split(' ').slice(0, 100).join(' ');
  const summary = summaryWords.endsWith('.') ? summaryWords : `${summaryWords}.`;

  // Extract keywords and topics using TF-IDF
  tfidf.addDocument(documentText);
  const keywords = [];
  tfidf.listTerms(0).forEach(item => {
    if (item.tfidf > 1) { // Threshold for relevance
      keywords.push(item.term);
    }
  });

  // Topics (grouping similar keywords, simplified as top keywords for now)
  const topics = keywords.slice(0, 5); // Top 5 keywords as topics

  // Extract key phrases (bigrams)
  const bigrams = natural.NGrams.bigrams(tokens);
  const keyPhrases = bigrams
    .filter(phrase => phrase.join(' ').length > 5) // Filter short phrases
    .slice(0, 5); // Limit to top 5 phrases

  // Determine category (basic rule-based approach)
  const categoryKeywords = {
    Technology: ['tech', 'software', 'ai', 'machine', 'computer'],
    Health: ['health', 'medical', 'disease', 'treatment', 'doctor'],
    Business: ['business', 'market', 'finance', 'economy', 'company'],
    Education: ['education', 'school', 'learning', 'student', 'teacher']
  };

  let category = 'General';
  for (const [cat, words] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => words.includes(keyword))) {
      category = cat;
      break;
    }
  }

  return {
    summary,
    topics,
    keywords: keywords.slice(0, 10), // Limit to top 10 keywords
    key_phrases: keyPhrases.map(phrase => phrase.join(' ')),
    category
  };
}

// Example usage: Read from a file or string
async function processDocument(input) {
  let text;
  try {
    // Check if input is a file path or direct text
    if (input.endsWith('.txt')) {
      text = fs.readFileSync(input, 'utf8');
    } else {
      text = input;
    }

    const metadata = generateMetadata(text);
    return metadata;
  } catch (error) {
    console.error('Error processing document:', error.message);
    return null;
  }
}

// Example execution
const sampleText = `
Artificial intelligence is transforming the tech industry. Machine learning models are used in various applications.
AI is improving efficiency in businesses and healthcare. New algorithms are being developed daily.
`;

processDocument(sampleText).then(metadata => {
  console.log('Generated Metadata:', JSON.stringify(metadata, null, 2));
});

// Export for use in other modules
export { processDocument };