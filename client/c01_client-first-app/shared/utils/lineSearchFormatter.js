// Common Line Search result formatting utility

// Convert markdown to HTML with safe link handling
function convertMarkdownToHTML(markdown) {
    // Don't decode HTML entities to preserve search highlighting marks
    const lines = markdown.split('\n');
    let html = '';
    let inList = false;
    
    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Handle headers
        if (trimmedLine.startsWith('## ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<h3>${trimmedLine.substring(3)}</h3>`;
            return;
        }
        if (trimmedLine.startsWith('### ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<h4>${trimmedLine.substring(4)}</h4>`;
            return;
        }
        
        // Handle numbered lists
        if (trimmedLine.match(/^\d+\. /)) {
            if (!inList) { html += '<ol>'; inList = 'ol'; }
            else if (inList === 'ul') { html += '</ul><ol>'; inList = 'ol'; }
            const listText = trimmedLine.replace(/^\d+\. /, '');
            html += `<li>${processInlineMarkdown(listText)}</li>`;
            return;
        }
        
        // Handle bullet lists
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            if (!inList) { html += '<ul>'; inList = 'ul'; }
            else if (inList === 'ol') { html += '</ol><ul>'; inList = 'ul'; }
            const listText = trimmedLine.substring(2);
            html += `<li>${processInlineMarkdown(listText)}</li>`;
            return;
        }
        
        // Close list if we're not in a list item
        if (inList && !trimmedLine.match(/^\d+\. /) && !trimmedLine.startsWith('- ') && !trimmedLine.startsWith('* ')) {
            html += inList === 'ol' ? '</ol>' : '</ul>';
            inList = false;
        }
        
        // Handle separators
        if (trimmedLine === '---') {
            html += '<hr class="result-separator">';
            return;
        }
        
        // Handle empty lines
        if (trimmedLine === '') {
            html += '<br>';
            return;
        }
        
        // Handle regular paragraphs
        if (index > 0 && !html.endsWith('>')) {
            html += '<br>';
        }
        
        html += processInlineMarkdown(line);
    });
    
    // Close any open lists
    if (inList) {
        html += inList === 'ol' ? '</ol>' : '</ul>';
    }
    
    return html;
}

// Process inline markdown elements
function processInlineMarkdown(text) {
    // Handle markdown links
    text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" class="view-document-link">$1</a>');
    
    // Handle bold text (but not if it's a full line header)
    if (!text.trim().startsWith('**') || !text.trim().endsWith('**') || text.includes(' ')) {
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    } else if (text.trim().startsWith('**') && text.trim().endsWith('**')) {
        // Full line bold (header)
        const boldText = text.trim().substring(2, text.trim().length - 2);
        return `<strong>${boldText}</strong>`;
    }
    
    // Handle italic text
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Handle code spans
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    return text;
}

// Format Line Search results in consolidated format
function formatLineSearchResults(results) {
    if (!results || results.length === 0) {
        const div = document.createElement('div');
        div.className = 'no-results';
        div.textContent = 'No results found';
        return div;
    }
    
    const formattedResults = results.map((result, index) => {
        const docLink = result.documentPath ? `[View Document](${result.documentPath})` : '';
        return `**Result ${index + 1}: ${result.title}**\n${result.excerpt}\n${docLink}\n`;
    }).join('\n---\n\n');
    
    const div = document.createElement('div');
    div.className = 'result-item line-search-results';
    const htmlContent = convertMarkdownToHTML(formattedResults);
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    while (doc.body.firstChild) {
        div.appendChild(doc.body.firstChild);
    }
    return div;
}

// Export functions for use in other modules
window.lineSearchFormatter = {
    convertMarkdownToHTML,
    formatLineSearchResults,
    processInlineMarkdown
};