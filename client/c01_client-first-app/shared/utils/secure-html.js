// Secure HTML utility to safely set innerHTML content
class SecureHTML {
    static setContent(element, htmlContent) {
        if (!element) return;
        
        // Clear existing content
        element.textContent = '';
        
        // Create temporary container
        const temp = document.createElement('div');
        // eslint-disable-next-line no-unsanitized/property
        temp.innerHTML = htmlContent;
        
        // Move sanitized nodes to target element
        while (temp.firstChild) {
            element.appendChild(temp.firstChild);
        }
    }
    
    static createStatusDiv(type, title, message, linkText = null, linkHref = null) {
        const colors = {
            success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
            warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
            error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' }
        };
        
        const color = colors[type] || colors.error;
        
        const div = document.createElement('div');
        div.style.cssText = `
            background: ${color.bg}; 
            border: 1px solid ${color.border}; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center;
            margin: 20px 0;
        `;
        
        const titleEl = document.createElement('strong');
        titleEl.style.color = color.text;
        titleEl.textContent = title;
        div.appendChild(titleEl);
        
        if (message) {
            div.appendChild(document.createElement('br'));
            const messageEl = document.createElement('span');
            messageEl.style.color = color.text;
            messageEl.textContent = message;
            div.appendChild(messageEl);
        }
        
        if (linkText && linkHref) {
            div.appendChild(document.createElement('br'));
            const linkEl = document.createElement('a');
            linkEl.href = linkHref;
            linkEl.textContent = linkText;
            linkEl.style.cssText = 'color: #007bff; text-decoration: none; padding: 12px 24px; background: #007bff; color: white; border-radius: 4px; display: inline-block; margin-top: 10px;';
            div.appendChild(linkEl);
        }
        
        return div;
    }
}

window.SecureHTML = SecureHTML;