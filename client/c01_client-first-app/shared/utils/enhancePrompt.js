// Shared Enhance Prompt functionality
// Used by search.html and ai-search.html

(function() {
  let pendingEnhanced = '';

  // Initialize enhance button — call on DOMContentLoaded
  // queryFieldId: ID of the query input/textarea
  // collectionFieldId: ID of the collection select
  window.initEnhancePrompt = function(queryFieldId, collectionFieldId) {
    const collectionSelect = document.getElementById(collectionFieldId);
    const enhanceBtn = document.getElementById('enhanceBtn');

    const updateEnhanceBtn = () => {
      if (enhanceBtn) {
        enhanceBtn.style.display = collectionSelect && collectionSelect.value ? 'inline-block' : 'none';
      }
    };

    if (collectionSelect && enhanceBtn) {
      collectionSelect.addEventListener('change', updateEnhanceBtn);
      // Re-check when collection section visibility changes
      const collectionSection = document.getElementById('collectionSection');
      if (collectionSection) {
        const observer = new MutationObserver(updateEnhanceBtn);
        observer.observe(collectionSection, { attributes: true });
      }
    }

    // Store config for use by enhancePrompt
    window._enhanceConfig = { queryFieldId, collectionFieldId };
  };

  window.enhancePrompt = async function() {
    const cfg = window._enhanceConfig || { queryFieldId: 'query', collectionFieldId: 'collection' };
    const queryEl = document.getElementById(cfg.queryFieldId);
    const collectionEl = document.getElementById(cfg.collectionFieldId);

    const query = queryEl ? queryEl.value.trim() : '';
    const collection = collectionEl ? collectionEl.value : '';

    if (!query) { window.showUserMessage('Please enter a query first', 'error'); return; }
    if (!collection) { window.showUserMessage('Please select a collection first', 'error'); return; }

    const btn = document.getElementById('enhanceBtn');
    btn.textContent = 'Enhancing...';
    btn.disabled = true;

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/fabric/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify({ query, collection })
      });
      const data = await response.json();
      if (!response.ok || !data.enhanced) throw new Error(data.error || 'Enhancement failed');

      pendingEnhanced = data.enhanced;
      document.getElementById('originalPromptPreview').textContent = query;
      document.getElementById('enhancedPromptPreview').textContent = data.enhanced;
      document.getElementById('enhancePreview').style.display = 'block';
    } catch (err) {
      window.showUserMessage('Prompt enhancement unavailable — using original query', 'warning');
    } finally {
      btn.textContent = '✨ Enhance Prompt';
      btn.disabled = false;
    }
  };

  window.useEnhanced = function() {
    const cfg = window._enhanceConfig || { queryFieldId: 'query' };
    const queryEl = document.getElementById(cfg.queryFieldId);
    if (queryEl) queryEl.value = pendingEnhanced;
    document.getElementById('enhancePreview').style.display = 'none';
  };

  window.cancelEnhance = function() {
    document.getElementById('enhancePreview').style.display = 'none';
  };
})();
