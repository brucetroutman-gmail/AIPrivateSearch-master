// Common Line Search result formatting utility

// Decode HTML entities
function decodeHtmlEntities(text) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${text}</div>`, 'text/html');
    return doc.body.textContent || '';
}

// Convert markdown to HTML with safe link handling
function convertMarkdownToHTML(markdown) {
    // Don't decode HTML entities to preserve search highlighting marks
    const lines = markdown.split('\n');
    let html = '';
    
    lines.forEach((line, index) => {
        if (index > 0) {
            html += '<br>';
        }
        
        // Handle markdown links
        const linkMatch = line.match(/\[([^\]]+)\]\(([^\)]+)\)/);
        if (linkMatch) {
            const beforeLink = line.substring(0, linkMatch.index);
            const afterLink = line.substring(linkMatch.index + linkMatch[0].length);
            
            html += beforeLink;
            html += `<a href="${linkMatch[2]}" target="_blank" style="color: #007bff; text-decoration: underline;">${linkMatch[1]}</a>`;
            html += afterLink;
        } else if (line.startsWith('**') && line.endsWith('**')) {
            // Handle bold headers
            const boldText = line.substring(2, line.length - 2);
            html += `<strong>${boldText}</strong>`;
        } else if (line === '---') {
            // Handle separators
            html += '<hr style="margin: 1rem 0; border: 1px solid var(--border-color);">';
        } else {
            html += line;
        }
    });
    
    return html;
}

// Format Line Search results in consolidated format
function formatLineSearchResults(results) {
    if (!results || results.length === 0) {
        return '<div class="no-results">No results found</div>';
    }
    
    const formattedResults = results.map((result, index) => {
        const docLink = result.documentPath ? `[View Document](${result.documentPath})` : '';
        return `**Result ${index + 1}: ${result.title}**\n${result.excerpt}\n${docLink}\n`;
    }).join('\n---\n\n');
    
    return `<div class="result-item line-search-results">${convertMarkdownToHTML(formattedResults)}</div>`;
}

// Export functions for use in other modules
window.lineSearchFormatter = {
    convertMarkdownToHTML,
    formatLineSearchResults
};