 
/* eslint-disable security/detect-unsafe-regex */
import natural from 'natural';

export class NLPAnalytics {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
  }

  extractEntities(text) {
    const entities = { people: [], organizations: [], locations: [] };
    
    // Enhanced person patterns
    const personPatterns = [
      /\b(?:Mr\.|Mrs\.|Dr\.|President|General|Colonel|Captain)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g,
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g
    ];
    
    // Enhanced organization patterns
    const orgPatterns = [
      /\b(?:Congress|Senate|House|Parliament|Government|Administration|Department|Ministry|Agency|Bureau|Commission|Committee|Council|Assembly)\b/gi,
      /\b(?:Corporation|Corp|Company|Co|Inc|LLC|Ltd|University|College|Institute|Foundation|Association|Society|Union)\b/gi
    ];
    
    // Enhanced location patterns
    const locationPatterns = [
      /\b(?:United States|America|Britain|Great Britain|England|France|Spain|Italy|Germany|Russia|China|Japan)\b/gi,
      /\b(?:New York|Washington|Boston|Philadelphia|Virginia|Massachusetts|Pennsylvania|Maryland|Georgia|Carolina|Connecticut|Delaware|Rhode Island)\b/gi,
      /\b(?:Europe|Asia|Africa|North America|South America)\b/gi
    ];

    // Extract people
    personPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      entities.people.push(...matches.filter(match => 
        !match.match(/^(?:The|This|That|These|Those|When|Where|What|How|Why)\s/i) &&
        match.length > 5 && match.length < 50
      ));
    });
    
    // Extract organizations
    orgPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      entities.organizations.push(...matches);
    });
    
    // Extract locations
    locationPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      entities.locations.push(...matches);
    });

    entities.people = [...new Set(entities.people)].slice(0, 8);
    entities.organizations = [...new Set(entities.organizations)].slice(0, 8);
    entities.locations = [...new Set(entities.locations)].slice(0, 8);

    return entities;
  }

  extractDates(text) {
    const datePatterns = [
      // Full date formats
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4}\b/gi,
      // Numeric formats
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      // Historical years (1600-2100)
      /\b(?:1[6-9]\d{2}|20\d{2}|21\d{2})\b/g,
      // Ordinal dates
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(?:1st|2nd|3rd|\d+th),?\s+\d{4}\b/gi
    ];

    const dates = [];
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      dates.push(...matches.filter(date => {
        // Filter out common false positives
        const year = parseInt(date.match(/\d{4}/)?.[0]);
        return year >= 1600 && year <= 2100;
      }));
    });

    return [...new Set(dates)].slice(0, 10);
  }

  extractKeyPhrases(text) {
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'this', 'that',
      'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our', 'you', 'your'
    ]);
    
    const filteredTokens = tokens.filter(token => 
      token.length > 2 && !stopWords.has(token) && /^[a-zA-Z]+$/.test(token)
    );

    const phrases = [];
    
    // Extract bigrams and trigrams
    for (let i = 0; i < filteredTokens.length - 1; i++) {
      const bigram = `${filteredTokens[i]} ${filteredTokens[i + 1]}`;
      phrases.push(bigram);
      
      // Add trigrams
      if (i < filteredTokens.length - 2) {
        const trigram = `${filteredTokens[i]} ${filteredTokens[i + 1]} ${filteredTokens[i + 2]}`;
        phrases.push(trigram);
      }
    }
    
    // Extract capitalized phrases (proper nouns)
    const capitalizedPhrases = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [];
    phrases.push(...capitalizedPhrases.map(p => p.toLowerCase()));

    const phraseCount = {};
    phrases.forEach(phrase => {
      if (phrase.length > 5 && phrase.length < 50) {
        phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
      }
    });

    return Object.entries(phraseCount)
      .filter(([phrase, count]) => count >= 2 || phrase.includes(' '))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([phrase]) => phrase);
  }

  calculateTextStats(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = this.tokenizer.tokenize(text) || [];
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    
    return {
      characterCount: text.length,
      wordCount: words.length,
      sentenceCount: sentences.length,
      uniqueWordCount: uniqueWords.size,
      averageSentenceLength: Math.round(words.length / sentences.length) || 0,
      readingTime: Math.ceil(words.length / 200)
    };
  }

  analyzeText(text) {
    const entities = this.extractEntities(text);
    const dates = this.extractDates(text);
    const keyPhrases = this.extractKeyPhrases(text);
    const stats = this.calculateTextStats(text);

    return {
      entities: {
        people: entities.people.join(', '),
        organizations: entities.organizations.join(', '),
        locations: entities.locations.join(', ')
      },
      dates: dates.join(', '),
      keyPhrases: keyPhrases.join(', '),
      ...stats
    };
  }
}