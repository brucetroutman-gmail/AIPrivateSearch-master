import fs from 'fs/promises';
import path from 'path';

class DocumentTypeAnalyzer {
  constructor() {
    this.patterns = {
      academic: {
        keywords: ['abstract', 'methodology', 'references', 'doi', 'journal', 'peer review', 'hypothesis', 'conclusion', 'literature review', 'statistical analysis'],
        structure: ['introduction', 'methods', 'results', 'discussion', 'bibliography'],
        weight: 0
      },
      legal: {
        keywords: ['whereas', 'herein', 'plaintiff', 'defendant', 'jurisdiction', 'statute', 'case law', 'precedent', 'court', 'legal'],
        structure: ['parties', 'jurisdiction', 'findings', 'order', 'citation'],
        weight: 0
      },
      technical: {
        keywords: ['api', 'documentation', 'installation', 'configuration', 'troubleshooting', 'dependencies', 'version', 'endpoint'],
        structure: ['overview', 'installation', 'usage', 'examples', 'api reference'],
        weight: 0
      },
      business: {
        keywords: ['revenue', 'profit', 'stakeholder', 'proposal', 'budget', 'quarterly', 'fiscal', 'department', 'executive'],
        structure: ['executive summary', 'objectives', 'analysis', 'recommendations', 'appendix'],
        weight: 0
      },
      medical: {
        keywords: ['patient', 'diagnosis', 'treatment', 'symptoms', 'medical history', 'clinical', 'therapy', 'medication', 'icd'],
        structure: ['chief complaint', 'history', 'examination', 'assessment', 'plan'],
        weight: 0
      },
      insurance: {
        keywords: ['policy', 'premium', 'deductible', 'coverage', 'beneficiary', 'claim', 'insured', 'liability', 'exclusion'],
        structure: ['policy number', 'coverage details', 'terms', 'conditions', 'exclusions'],
        weight: 0
      },
      will: {
        keywords: ['testator', 'executor', 'beneficiary', 'bequest', 'estate', 'inherit', 'witness', 'probate', 'guardian'],
        structure: ['declaration', 'revocation', 'bequests', 'executor appointment', 'signatures'],
        weight: 0
      },
      powerOfAttorney: {
        keywords: ['attorney-in-fact', 'principal', 'durable', 'agent', 'incapacity', 'revoke', 'authority', 'healthcare'],
        structure: ['principal information', 'agent appointment', 'powers granted', 'limitations', 'effective date'],
        weight: 0
      },
      realEstate: {
        keywords: ['property', 'deed', 'mortgage', 'title', 'escrow', 'appraisal', 'zoning', 'parcel', 'recording'],
        structure: ['property description', 'parties', 'consideration', 'legal description', 'signatures'],
        weight: 0
      },
      employment: {
        keywords: ['employee', 'salary', 'benefits', 'termination', 'performance', 'confidentiality', 'position', 'responsibilities'],
        structure: ['position details', 'compensation', 'responsibilities', 'terms', 'signatures'],
        weight: 0
      },
      tax: {
        keywords: ['income', 'deduction', 'refund', 'filing', 'taxpayer', 'withholding', 'credit', 'schedule', 'irs'],
        structure: ['income section', 'deductions', 'tax computation', 'payments', 'refund'],
        weight: 0
      },
      news: {
        keywords: ['breaking', 'reporter', 'source', 'statement', 'according to', 'investigation', 'exclusive', 'update'],
        structure: ['headline', 'byline', 'lead', 'body', 'quotes'],
        weight: 0
      },
      creative: {
        keywords: ['character', 'plot', 'dialogue', 'setting', 'narrative', 'protagonist', 'conflict', 'theme'],
        structure: ['chapter', 'scene', 'dialogue', 'description', 'narrative'],
        weight: 0
      },
      educational: {
        keywords: ['learning', 'objective', 'curriculum', 'assessment', 'grade', 'student', 'lesson', 'standards'],
        structure: ['objectives', 'materials', 'activities', 'assessment', 'resources'],
        weight: 0
      },
      financial: {
        keywords: ['balance sheet', 'income statement', 'cash flow', 'assets', 'liabilities', 'equity', 'gaap', 'audit'],
        structure: ['financial statements', 'notes', 'auditor report', 'management discussion'],
        weight: 0
      }
    };

    this.metadataTemplates = {
      academic: {
        doi: null,
        authors: [],
        institution: null,
        journal: null,
        publicationDate: null,
        citationCount: null,
        researchField: [],
        methodology: [],
        abstractWordCount: null,
        referencesCount: null,
        figuresTablesCount: null,
        statisticalMethods: [],
        datasetSize: null,
        peerReviewed: null
      },
      legal: {
        documentType: null,
        jurisdiction: null,
        courtLevel: null,
        caseNumber: null,
        legalCitations: [],
        legalTopics: [],
        parties: [],
        legalPrecedents: null,
        effectiveDate: null,
        supersededDocuments: [],
        legalStatus: null
      },
      technical: {
        productSystem: null,
        version: null,
        technologyStack: [],
        targetAudience: [],
        prerequisites: [],
        codeExamplesCount: null,
        apiEndpoints: null,
        configurationFiles: null,
        troubleshootingSections: null,
        installationSteps: null,
        dependencies: []
      },
      business: {
        documentType: null,
        department: null,
        fiscalPeriod: null,
        budgetImpact: null,
        stakeholders: [],
        decisionPoints: null,
        actionItems: null,
        financialFigures: [],
        marketData: [],
        complianceRequirements: [],
        approvalStatus: null
      },
      medical: {
        medicalSpecialties: [],
        patientDemographics: {},
        studyType: null,
        sampleSize: null,
        duration: null,
        primaryEndpoints: [],
        secondaryEndpoints: [],
        medicationsTreatments: [],
        medicalConditions: [],
        diagnosticCriteria: [],
        ethicsApproval: null
      },
      insurance: {
        policyType: null,
        policyNumber: null,
        insuranceCompany: null,
        policyHolder: null,
        coverageAmount: null,
        premium: null,
        deductible: null,
        effectiveDate: null,
        expirationDate: null,
        coverageAreas: [],
        exclusions: [],
        ridersEndorsements: [],
        claimsHistory: null,
        renewalStatus: null,
        agentBroker: null
      },
      will: {
        documentType: null,
        testator: null,
        executionDate: null,
        witnesses: [],
        notarization: null,
        executor: null,
        beneficiaries: [],
        assetsCovered: [],
        specificBequests: null,
        residuaryClause: null,
        guardianAppointments: [],
        trustProvisions: [],
        previousWills: null,
        jurisdiction: null,
        legalRequirementsMet: []
      },
      powerOfAttorney: {
        poaType: null,
        principal: null,
        agent: null,
        effectiveDate: null,
        expiration: null,
        powersGranted: [],
        limitations: [],
        durability: null,
        activationTrigger: null,
        revocationClause: null,
        successorAgents: [],
        witnessRequirements: [],
        recordingStatus: null,
        healthcareDirectives: [],
        hipaaAuthorization: null
      },
      realEstate: {
        documentType: null,
        propertyAddress: null,
        parcelId: null,
        propertyType: null,
        squareFootage: null,
        transactionType: null,
        transactionAmount: null,
        parties: [],
        recordingDate: null,
        recordingNumber: null,
        legalDescription: null,
        zoning: null,
        propertyTax: null,
        liensEncumbrances: [],
        titleCompany: null,
        surveyDate: null
      },
      employment: {
        documentType: null,
        employeeId: null,
        positionTitle: null,
        department: null,
        employmentType: null,
        startDate: null,
        salaryWage: null,
        benefits: [],
        reportingStructure: {},
        jobResponsibilities: [],
        performanceMetrics: [],
        confidentialityAgreements: [],
        terminationConditions: [],
        stockOptions: {},
        workLocation: null,
        reviewPeriod: null
      },
      tax: {
        taxYear: null,
        formType: null,
        filingStatus: null,
        taxpayerId: null,
        incomeSources: [],
        deductions: [],
        credits: [],
        taxOwed: null,
        refundAmount: null,
        filingDate: null,
        extensionFiled: null,
        amendedReturn: null,
        supportingDocuments: [],
        preparerInfo: null,
        electronicFiling: null,
        stateReturns: []
      },
      news: {
        publication: null,
        section: null,
        byline: null,
        publicationDate: null,
        location: null,
        newsCategory: null,
        sourcesQuoted: null,
        geographicScope: null,
        politicalLeaning: null,
        factChecked: null,
        updateHistory: []
      },
      creative: {
        genre: [],
        narrativeStyle: null,
        settingPeriod: null,
        settingLocation: null,
        characterCount: {},
        plotStructure: null,
        literaryDevices: [],
        dialoguePercentage: null,
        tense: null,
        pointOfView: null,
        contentWarnings: []
      },
      educational: {
        gradeLevel: null,
        subjectArea: [],
        learningObjectives: [],
        prerequisites: [],
        duration: null,
        assessmentType: [],
        difficultyLevel: null,
        interactiveElements: [],
        standardsAlignment: [],
        ageAppropriateness: null
      },
      financial: {
        reportType: null,
        fiscalPeriod: null,
        currency: null,
        financialMetrics: [],
        industrySector: null,
        marketCap: null,
        accountingStandards: null,
        auditor: null,
        riskFactors: null,
        forwardLookingStatements: null
      }
    };
  }

  async analyzeDocument(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      const fileStats = await fs.stat(filePath);
      
      const documentType = this.determineDocumentType(content);
      const baseMetadata = this.generateBaseMetadata(fileName, content, fileStats);
      const specificMetadata = this.generateSpecificMetadata(documentType, content);
      
      return {
        ...baseMetadata,
        documentType,
        specificMetadata
      };
    } catch (error) {
      throw new Error(`Error analyzing document: ${error.message}`);
    }
  }

  determineDocumentType(content) {
    const lowerContent = content.toLowerCase();
    
    // Reset weights
    Object.keys(this.patterns).forEach(type => {
      this.patterns[type].weight = 0;
    });

    // Score based on keywords
    Object.entries(this.patterns).forEach(([type, pattern]) => {
      pattern.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
        const matches = (lowerContent.match(regex) || []).length;
        pattern.weight += matches * 2; // Keywords get double weight
      });

      // Score based on structure
      pattern.structure.forEach(structureElement => {
        if (lowerContent.includes(structureElement.toLowerCase())) {
          pattern.weight += 3; // Structure elements get triple weight
        }
      });
    });

    // Find the highest scoring type
    let bestType = 'general';
    let highestScore = 0;

    Object.entries(this.patterns).forEach(([type, pattern]) => {
      if (pattern.weight > highestScore) {
        highestScore = pattern.weight;
        bestType = type;
      }
    });

    // Require minimum confidence threshold
    return highestScore >= 3 ? bestType : 'general';
  }

  generateBaseMetadata(fileName, content, fileStats) {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    // Extract most frequent nouns and verbs (simplified)
    const wordFreq = {};
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });

    const frequentWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);

    return {
      fileName,
      fileSize: fileStats.size,
      createdDate: fileStats.birthtime,
      modifiedDate: fileStats.mtime,
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence: Math.round(words.length / sentences.length),
      readingTimeMinutes: Math.ceil(words.length / 200), // Assuming 200 words per minute
      frequentWords,
      contentPreview: content.substring(0, 500) + '...'
    };
  }

  generateSpecificMetadata(documentType, content) {
    if (documentType === 'general' || !this.metadataTemplates[documentType]) {
      return {};
    }

    const template = { ...this.metadataTemplates[documentType] };
    
    // Apply document-type-specific analysis
    switch (documentType) {
      case 'academic':
        return this.analyzeAcademicDocument(template, content);
      case 'legal':
        return this.analyzeLegalDocument(template, content);
      case 'insurance':
        return this.analyzeInsuranceDocument(template, content);
      case 'medical':
        return this.analyzeMedicalDocument(template, content);
      // Add more specific analyzers as needed
      default:
        return template;
    }
  }

  analyzeAcademicDocument(template, content) {
    // Extract authors from common patterns
    const authorPattern = /(?:authors?|by)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*)/gi;
    const authorMatch = content.match(authorPattern);
    if (authorMatch) {
      template.authors = authorMatch[0].replace(/authors?|by/gi, '').replace(/[:]/g, '').trim().split(',').map(a => a.trim());
    }

    // Count references
    const refPattern = /$$\d+$$|$$\d{4}$$/g;
    const references = content.match(refPattern);
    template.referencesCount = references ? references.length : 0;

    // Extract DOI
    const doiPattern = /doi:\s*(10\.\d+\/[^\s]+)/i;
    const doiMatch = content.match(doiPattern);
    if (doiMatch) {
      template.doi = doiMatch[1];
    }

    return template;
  }

  analyzeLegalDocument(template, content) {
    // Extract case numbers
    const casePattern = /case\s+no\.?\s*([A-Z0-9-]+)/i;
    const caseMatch = content.match(casePattern);
    if (caseMatch) {
      template.caseNumber = caseMatch[1];
    }

    // Extract parties
    const partiesPattern = /(?:plaintiff|defendant|petitioner|respondent)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
    const partiesMatches = content.match(partiesPattern);
    if (partiesMatches) {
      template.parties = partiesMatches.map(match => match.replace(/plaintiff|defendant|petitioner|respondent/gi, '').replace(/[:]/g, '').trim());
    }

    return template;
  }

  analyzeInsuranceDocument(template, content) {
    // Extract policy number
    const policyPattern = /policy\s+(?:number|no\.?)\s*:?\s*([A-Z0-9-]+)/i;
    const policyMatch = content.match(policyPattern);
    if (policyMatch) {
      template.policyNumber = policyMatch[1];
    }

    // Extract coverage amount
    const coveragePattern = /coverage\s+(?:amount|limit)\s*:?\s*\$?([\d,]+)/i;
    const coverageMatch = content.match(coveragePattern);
    if (coverageMatch) {
      template.coverageAmount = coverageMatch[1].replace(/,/g, '');
    }

    return template;
  }

  analyzeMedicalDocument(template, content) {
    // Extract ICD codes
    const icdPattern = /[A-Z]\d{2}(?:\.\d+)?/g;
    const icdMatches = content.match(icdPattern);
    if (icdMatches) {
      template.diagnosticCriteria = [...new Set(icdMatches)];
    }

    // Extract patient demographics patterns
    const agePattern = /age\s*:?\s*(\d+)/i;
    const ageMatch = content.match(agePattern);
    if (ageMatch) {
      template.patientDemographics.age = parseInt(ageMatch[1]);
    }

    return template;
  }

  async processDirectory(directoryPath) {
  try {
    const files = await fs.readdir(directoryPath);
    const results = [];

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.stat(filePath);
      
      // Skip directories and non-text files
      if (stats.isDirectory()) {
        continue;
      }

      // Filter for supported file types
      const supportedExtensions = ['.txt', '.md', '.doc', '.docx', '.pdf', '.html', '.rtf'];
      const fileExtension = path.extname(file).toLowerCase();
      
      if (!supportedExtensions.includes(fileExtension)) {
        console.log(`Skipping unsupported file type: ${file}`);
        continue;
      }

      try {
        // Analyze each document
        const metadata = await this.analyzeDocument(filePath);
        results.push({
          filePath,
          fileName: file,
          ...metadata
        });
        
        console.log(`Processed: ${file} - Type: ${metadata.documentType}`);
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError.message);
        results.push({
          filePath,
          fileName: file,
          error: fileError.message,
          documentType: 'error'
        });
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Error processing directory: ${error.message}`);
  }
}

// Additional utility methods to complete the class
async processDirectoryRecursive(directoryPath, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    const files = await fs.readdir(directoryPath);
    let allResults = [];

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        // Recursively process subdirectories
        const subResults = await this.processDirectoryRecursive(filePath, maxDepth, currentDepth + 1);
        allResults = allResults.concat(subResults);
      } else {
        // Process individual files
        const supportedExtensions = ['.txt', '.md', '.doc', '.docx', '.pdf', '.html', '.rtf'];
        const fileExtension = path.extname(file).toLowerCase();
        
        if (supportedExtensions.includes(fileExtension)) {
          try {
            const metadata = await this.analyzeDocument(filePath);
            allResults.push({
              filePath,
              fileName: file,
              directory: directoryPath,
              depth: currentDepth,
              ...metadata
            });
          } catch (fileError) {
            console.error(`Error processing file ${file}:`, fileError.message);
            allResults.push({
              filePath,
              fileName: file,
              directory: directoryPath,
              depth: currentDepth,
              error: fileError.message,
              documentType: 'error'
            });
          }
        }
      }
    }

    return allResults;
  } catch (error) {
    throw new Error(`Error processing directory recursively: ${error.message}`);
  }
}

async generateReport(results, outputPath) {
  const report = {
    summary: {
      totalDocuments: results.length,
      documentTypes: {},
      errors: 0,
      processedDate: new Date().toISOString()
    },
    documents: results
  };

  // Generate summary statistics
  results.forEach(result => {
    if (result.error) {
      report.summary.errors++;
    } else {
      const type = result.documentType || 'unknown';
      report.summary.documentTypes[type] = (report.summary.documentTypes[type] || 0) + 1;
    }
  });

  // Write report to file
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  console.log(`Report generated: ${outputPath}`);
  
  return report;
}

async filterByDocumentType(results, documentType) {
  return results.filter(result => result.documentType === documentType);
}

async searchByMetadata(results, searchCriteria) {
  return results.filter(result => {
    if (!result.specificMetadata) return false;
    
    return Object.entries(searchCriteria).every(([key, value]) => {
      const metadataValue = result.specificMetadata[key];
      if (Array.isArray(metadataValue)) {
        return metadataValue.some(item => 
          item.toString().toLowerCase().includes(value.toString().toLowerCase())
        );
      }
      return metadataValue && metadataValue.toString().toLowerCase().includes(value.toString().toLowerCase());
    });
  });
}
}

// Usage example
const analyzer = new DocumentTypeAnalyzer();

// Process a single directory
analyzer.processDirectory('./documents')
  .then(results => {
    console.log(`Processed ${results.length} documents`);
    return analyzer.generateReport(results, './document-analysis-report.json');
  })
  .catch(error => console.error('Processing error:', error));

// Process directory recursively
analyzer.processDirectoryRecursive('./documents', 3)
  .then(results => {
    console.log(`Recursively processed ${results.length} documents`);
    
    // Filter for legal documents
    return analyzer.filterByDocumentType(results, 'legal');
  })
  .then(legalDocs => {
    console.log(`Found ${legalDocs.length} legal documents`);
  })
  .catch(error => console.error('Processing error:', error));

// Search for insurance documents with specific criteria
analyzer.processDirectory('./insurance-docs')
  .then(results => {
    return analyzer.searchByMetadata(results, {
      policyType: 'auto',
      insuranceCompany: 'state farm'
    });
  })
  .then(filteredResults => {
    console.log(`Found ${filteredResults.length} matching insurance documents`);
  })
  .catch(error => console.error('Search error:', error));
   
