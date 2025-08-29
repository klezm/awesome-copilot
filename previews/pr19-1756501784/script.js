// Global variables
let allData = { prompts: [], instructions: [], chatmodes: [] };
let filteredData = [];
let displayedItems = 0;
const itemsPerPage = 10;
let currentModalItem = null;
let isSourceView = false;
let isLoading = false;

// DOM elements
const searchInput = document.getElementById('search');
const typeFilter = document.getElementById('type-filter');
const resultsContainer = document.getElementById('results');
const totalCountElement = document.getElementById('total-count');
const paginationContainer = document.getElementById('pagination');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const pageInfoElement = document.getElementById('page-info');

// Initialize the application
async function init() {
    try {
        // Load data
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allData = await response.json();
        
        // Initialize display
        updateFilteredData();
        setupEventListeners();
        setupHelpModal();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load content. Please refresh the page and try again.');
    }
}

// Set up event listeners
function setupEventListeners() {
    // Search input with debounce
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            displayedItems = 0;
            updateFilteredData();
        }, 300);
    });

    // Type filter
    typeFilter.addEventListener('change', () => {
        displayedItems = 0;
        updateFilteredData();
    });

    // Infinite scroll
    window.addEventListener('scroll', throttle(() => {
        if (isLoading) return;
        
        const scrollPosition = window.innerHeight + window.scrollY;
        const threshold = document.body.offsetHeight - 1000; // Load more when 1000px from bottom
        
        if (scrollPosition >= threshold && displayedItems < filteredData.length) {
            loadMoreItems();
        }
    }, 100));

    // Keyboard navigation for main list and shortcuts
    document.addEventListener('keydown', (e) => {
        handleGlobalKeydown(e);
    });

    // Preview modal event listeners
    setupModalEventListeners();
    
    // Results container event delegation for preview buttons and card clicks
    resultsContainer.addEventListener('click', (e) => {
        // Check if click is on a button or link (prevent card click)
        if (e.target.matches('button, a, .btn') || e.target.closest('button, a, .btn')) {
            return; // Let the button/link handle its own click
        }
        
        // Check if click is on a card
        if (e.target.matches('.item-card') || e.target.closest('.item-card')) {
            e.preventDefault();
            const card = e.target.matches('.item-card') ? e.target : e.target.closest('.item-card');
            const item = JSON.parse(card.getAttribute('data-item'));
            showPreviewModal(item);
        }
    });

    // Hover events for tooltip preview with improved behavior
    resultsContainer.addEventListener('mouseover', (e) => {
        if (e.target.matches('.item-card') || e.target.closest('.item-card')) {
            const card = e.target.matches('.item-card') ? e.target : e.target.closest('.item-card');
            
            // Clear any existing timeout
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
            }
            
            // Don't show tooltip if modal is open
            const modal = document.getElementById('preview-modal');
            if (modal.classList.contains('show')) {
                return;
            }
            
            const item = JSON.parse(card.getAttribute('data-item'));
            
            // Show tooltip immediately on hover
            showTooltipPreview(item, card);
        }
    }, true);

    resultsContainer.addEventListener('mouseout', (e) => {
        if (e.target.matches('.item-card') || e.target.closest('.item-card')) {
            // Only hide if we're not moving to a child element of the same card
            const card = e.target.matches('.item-card') ? e.target : e.target.closest('.item-card');
            const relatedTarget = e.relatedTarget;
            
            if (!relatedTarget || !card.contains(relatedTarget)) {
                hideTooltipPreview();
            }
        }
    }, true);

    // Keyboard support for clickable cards
    resultsContainer.addEventListener('keydown', (e) => {
        if (e.target.matches('.item-card') || e.target.closest('.item-card')) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const card = e.target.matches('.item-card') ? e.target : e.target.closest('.item-card');
                const item = JSON.parse(card.getAttribute('data-item'));
                showPreviewModal(item);
            }
        }
    });
}

// Update filtered data based on search and filter criteria
function updateFilteredData() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedType = typeFilter.value;
    
    // Combine all data
    let combinedData = [];
    if (selectedType === 'all' || selectedType === 'prompts') {
        combinedData = combinedData.concat(allData.prompts);
    }
    if (selectedType === 'all' || selectedType === 'instructions') {
        combinedData = combinedData.concat(allData.instructions);
    }
    if (selectedType === 'all' || selectedType === 'chatmodes') {
        combinedData = combinedData.concat(allData.chatmodes);
    }
    
    // Filter by search term
    if (searchTerm) {
        filteredData = combinedData.filter(item => 
            item.title.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.file.toLowerCase().includes(searchTerm)
        );
    } else {
        filteredData = combinedData;
    }
    
    // Sort alphabetically by title
    filteredData.sort((a, b) => a.title.localeCompare(b.title));
    
    displayedItems = 0;
    updateDisplay();
    loadMoreItems();
}

// Update the display with current filtered data
function updateDisplay() {
    updateStats();
    if (filteredData.length === 0) {
        showEmptyState();
        hidePagination();
    } else {
        resultsContainer.innerHTML = '';
        hidePagination();
    }
}

// Update statistics display
function updateStats() {
    const displayed = Math.min(displayedItems, filteredData.length);
    const total = filteredData.length;
    const searchTerm = searchInput.value.trim();
    const selectedType = typeFilter.value;
    
    let statsText = `Showing ${displayed} of ${total} item${total !== 1 ? 's' : ''}`;
    
    if (searchTerm || selectedType !== 'all') {
        const filters = [];
        if (searchTerm) filters.push(`search: "${searchTerm}"`);
        if (selectedType !== 'all') filters.push(`type: ${selectedType}`);
        statsText += ` (filtered by ${filters.join(', ')})`;
    }
    
    totalCountElement.textContent = statsText;
}

// Load more items for infinite scroll
function loadMoreItems() {
    if (isLoading || displayedItems >= filteredData.length) return;
    
    isLoading = true;
    
    const endIndex = Math.min(displayedItems + itemsPerPage, filteredData.length);
    const newItems = filteredData.slice(displayedItems, endIndex);
    
    if (newItems.length === 0) {
        isLoading = false;
        return;
    }
    
    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-more';
    loadingIndicator.innerHTML = '<div class="loading">Loading more items...</div>';
    resultsContainer.appendChild(loadingIndicator);
    
    // Simulate a brief loading delay for better UX
    setTimeout(() => {
        // Remove loading indicator
        loadingIndicator.remove();
        
        // Add new items
        const itemsHtml = newItems.map(item => createItemCard(item)).join('');
        resultsContainer.insertAdjacentHTML('beforeend', itemsHtml);
        
        displayedItems = endIndex;
        isLoading = false;
        
        // Update stats to show current display count
        updateStats();
    }, 200);
}

// Render items for current page (legacy - replaced by loadMoreItems)
function renderItems() {
    // This function is now handled by loadMoreItems for infinite scroll
    return;
}

// Create HTML for a single item card
function createItemCard(item) {
    const descriptionHtml = item.description 
        ? `<p class="item-description">${escapeHtml(item.description)}</p>`
        : '';
    
    // Get the appropriate emoji and label for each type
    const typeInfo = {
        'chatmodes': { emoji: '💭', label: 'Chat Mode' },
        'instructions': { emoji: '📋', label: 'Instruction' },
        'prompts': { emoji: '🎯', label: 'Prompt' }
    };
    
    const { emoji, label } = typeInfo[item.type] || { emoji: '', label: 'Unknown' };
    
    return `
        <div class="item-card clickable-card" data-item='${JSON.stringify(item).replace(/'/g, "&apos;")}' role="button" tabindex="0" aria-label="Click to preview ${escapeHtml(item.title)}">
            <div class="item-header">
                <div class="item-title-section">
                    <h3 class="item-title">${escapeHtml(item.title)}</h3>
                    <span class="preview-indicator">👁️ Click to preview</span>
                </div>
                <span class="item-type">${emoji} ${label}</span>
            </div>
            ${descriptionHtml}
            <div class="item-actions">
                <a href="${item.vscodeUrl}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
                    <span class="install-badge">
                        <img src="https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white" alt="VS Code Install" />
                    </span>
                </a>
                <a href="${item.insidersUrl}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">
                    <span class="install-badge">
                        <img src="https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white" alt="VS Code Insiders Install" />
                    </span>
                </a>
                <a href="${item.sourceUrl || item.link}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer" title="View source on GitHub">
                    🔗 View on GitHub
                </a>
            </div>
        </div>
    `;
}

// Show empty state when no results
function showEmptyState() {
    const searchTerm = searchInput.value.trim();
    const selectedType = typeFilter.value;
    
    let message = 'No items found';
    if (searchTerm || selectedType !== 'all') {
        message += ' matching your criteria';
    }
    message += '.';
    
    let suggestion = '';
    if (searchTerm) {
        suggestion = '<br><br>Try adjusting your search terms or clearing the search to see all items.';
    } else if (selectedType !== 'all') {
        suggestion = '<br><br>Try selecting "All Types" to see more items.';
    }
    
    resultsContainer.innerHTML = `
        <div class="loading">
            <p>${message}${suggestion}</p>
        </div>
    `;
}

// Show error state
function showError(message) {
    resultsContainer.innerHTML = `
        <div class="loading">
            <p style="color: #d73a49;">❌ ${escapeHtml(message)}</p>
        </div>
    `;
}

// Update pagination controls
// Hide pagination (replaced by infinite scroll)
function hidePagination() {
    if (paginationContainer) {
        paginationContainer.style.display = 'none';
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Scroll to top of results (still useful for certain actions)
function scrollToTop() {
    const mainElement = document.getElementById('main');
    if (mainElement) {
        mainElement.scrollIntoView({ behavior: 'smooth' });
    }
}

// Global keyboard shortcuts handler
function handleGlobalKeydown(e) {
    // Don't interfere with input elements unless it's a special key
    const isInInput = e.target.matches('input, select, button, a, textarea');
    
    // Check if any modal is open
    const previewModal = document.getElementById('preview-modal');
    const helpModal = document.getElementById('help-modal');
    const isModalOpen = previewModal?.classList.contains('show') || helpModal?.classList.contains('show');
    
    // Handle modal-specific shortcuts first
    if (isModalOpen && previewModal?.classList.contains('show')) {
        if (e.key === 'Escape') {
            e.preventDefault();
            hidePreviewModal();
            hideTooltipPreview();
            return;
        }
        
        if ((e.key === 's' || e.key === 'S') && !isInInput) {
            e.preventDefault();
            toggleSourceView();
            return;
        }
        
        // Navigate between items in the modal
        if (e.key === 'ArrowLeft' && !isInInput) {
            e.preventDefault();
            navigateToAdjacentItem('previous');
            return;
        }
        
        if (e.key === 'ArrowRight' && !isInInput) {
            e.preventDefault();
            navigateToAdjacentItem('next');
            return;
        }
    }
    
    // Handle help modal shortcuts
    if (helpModal?.classList.contains('show')) {
        if (e.key === 'Escape') {
            e.preventDefault();
            hideHelpModal();
            return;
        }
    }
    
    // Handle help modal trigger (only when no modal is open)
    if (e.key === '?' && !isInInput && !isModalOpen) {
        e.preventDefault();
        showHelpModal();
        return;
    }
    
    // Close any modal with Escape
    if (e.key === 'Escape') {
        e.preventDefault();
        hidePreviewModal();
        hideTooltipPreview();
        hideHelpModal();
        return;
    }
    
    // List navigation with arrow keys (only when not in input)
    if (!isInInput && !currentModalItem) {
        const cards = document.querySelectorAll('.item-card');
        if (cards.length === 0) return;
        
        const currentFocused = document.activeElement;
        let currentIndex = Array.from(cards).indexOf(currentFocused);
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentIndex < 0) {
                cards[0].focus();
            } else if (currentIndex < cards.length - 1) {
                cards[currentIndex + 1].focus();
            }
            
            // Load more items if near the end
            if (currentIndex >= cards.length - 3) {
                loadMoreItems();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentIndex > 0) {
                cards[currentIndex - 1].focus();
            } else if (currentIndex < 0 && cards.length > 0) {
                cards[cards.length - 1].focus();
            }
        } else if (e.key === 'Enter' || e.key === ' ') {
            if (currentFocused && currentFocused.classList.contains('item-card')) {
                e.preventDefault();
                const itemData = currentFocused.getAttribute('data-item');
                if (itemData) {
                    const item = JSON.parse(itemData);
                    showPreviewModal(item);
                }
            }
        }
    }
    
    // Focus search with '/' key
    if (e.key === '/' && !isInInput) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
}

// Help modal functionality
function showHelpModal() {
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
        helpModal.classList.add('show');
        helpModal.setAttribute('aria-hidden', 'false');
        
        // Focus the close button
        const closeBtn = document.getElementById('help-modal-close');
        if (closeBtn) {
            closeBtn.focus();
        }
    }
}

function hideHelpModal() {
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
        helpModal.classList.remove('show');
        helpModal.setAttribute('aria-hidden', 'true');
    }
}

function setupHelpModal() {
    const helpModal = document.getElementById('help-modal');
    const helpOverlay = helpModal?.querySelector('.modal-overlay');
    const helpClose = document.getElementById('help-modal-close');
    const helpCloseFooter = document.getElementById('help-modal-close-footer');
    const floatingHelpBtn = document.getElementById('floating-help-btn');
    
    // Close modal events
    if (helpOverlay) helpOverlay.addEventListener('click', hideHelpModal);
    if (helpClose) helpClose.addEventListener('click', hideHelpModal);
    if (helpCloseFooter) helpCloseFooter.addEventListener('click', hideHelpModal);
    if (floatingHelpBtn) floatingHelpBtn.addEventListener('click', showHelpModal);
    
    // Prevent modal content clicks from closing modal
    const helpContent = helpModal?.querySelector('.modal-content');
    if (helpContent) {
        helpContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Focus trap for help modal
    if (helpModal) {
        helpModal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideHelpModal();
                return;
            }
            
            if (e.key === 'Tab') {
                const focusableElements = helpModal.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }
}

// Preview functionality
let previewCache = new Map();
let currentTooltip = null;
let tooltipTimeout = null;

// Get raw content URL for GitHub
function getRawContentUrl(sourceUrl) {
    // Convert GitHub blob URLs to raw URLs
    if (sourceUrl.includes('github.com') && sourceUrl.includes('/blob/')) {
        return sourceUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    return sourceUrl;
}

// Fetch markdown content
async function fetchMarkdownContent(sourceUrl) {
    try {
        const rawUrl = getRawContentUrl(sourceUrl);
        
        // Check cache first
        if (previewCache.has(rawUrl)) {
            return previewCache.get(rawUrl);
        }
        
        // For demo purposes, if we can't fetch from GitHub, show sample content
        let content;
        try {
            const response = await fetch(rawUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            content = await response.text();
        } catch (fetchError) {
            // Fallback to demo content when external requests are blocked
            content = generateSampleContent(sourceUrl);
        }
        
        // Cache the content
        previewCache.set(rawUrl, content);
        
        return content;
    } catch (error) {
        console.error('Error fetching content:', error);
        throw new Error('Failed to load content. Please try again.');
    }
}

// Generate sample content for demo purposes
function generateSampleContent(sourceUrl) {
    const filename = sourceUrl.split('/').pop();
    const isPrompt = filename.includes('.prompt.');
    const isInstruction = filename.includes('.instructions.');
    const isChatMode = filename.includes('.chatmode.');
    
    let type = 'Template';
    if (isPrompt) type = 'Prompt';
    else if (isInstruction) type = 'Instruction';
    else if (isChatMode) type = 'Chat Mode';
    
    return `---
description: 'Sample ${type.toLowerCase()} for preview demonstration'
mode: 'agent'
---

# ${filename.replace(/\.(prompt|instructions|chatmode)\.md$/, '').replace(/[-_]/g, ' ')}

This is a sample ${type.toLowerCase()} demonstrating the preview functionality. In a live environment, this would show the actual content from GitHub.

## Features

- **Interactive Preview**: Click the 👁️ Preview button for full content modal
- **Hover Tooltips**: Hover over cards for quick preview tooltips
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Design**: Works on desktop and mobile devices

## Usage

\`\`\`markdown
This ${type.toLowerCase()} would contain specific instructions or content
for GitHub Copilot to use in your development workflow.
\`\`\`

## Example Content

- **Guidance**: Step-by-step instructions
- **Best Practices**: Industry-standard approaches
- **Code Examples**: Practical implementations
- **Tips & Tricks**: Expert recommendations

> **Note**: This is preview content. The actual ${type.toLowerCase()} contains domain-specific instructions and examples.

### Key Benefits

1. **Enhanced Productivity**: Streamlined workflows
2. **Consistent Quality**: Standardized approaches  
3. **Learning Resource**: Educational content
4. **Time Saving**: Automated assistance

For the complete ${type.toLowerCase()}, please use the install buttons to add it to your VS Code environment.`;
}

// Markdown to HTML converter using marked.js with fallback
function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    // Extract front matter
    let frontMatter = '';
    let content = markdown;
    const frontMatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n/);
    if (frontMatterMatch) {
        frontMatter = frontMatterMatch[1];
        content = markdown.replace(/^---[\s\S]*?---\n?/, '');
    }
    
    let htmlContent = '';
    
    // Try to use marked.js if available
    if (typeof marked !== 'undefined') {
        try {
            // Configure marked options for better security and formatting
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: false,
                mangle: false,
                sanitize: false, // We trust the content from GitHub
                smartLists: true,
                smartypants: false
            });
            
            htmlContent = marked.parse(content);
        } catch (error) {
            console.error('Error parsing markdown with marked:', error);
            htmlContent = fallbackMarkdownToHtml(content);
        }
    } else {
        // Fallback to enhanced simple parser if marked is not available
        console.log('Using fallback markdown parser (marked.js not available)');
        htmlContent = fallbackMarkdownToHtml(content);
    }
    
    // Add frontmatter if it exists - show it above content and make it visible when scrolling up
    if (frontMatter) {
        const frontMatterHtml = `<div class="frontmatter-container" id="frontmatter-section">
            <div class="frontmatter-header">
                <h4>Front Matter</h4>
            </div>
            <pre><code class="language-yaml">${escapeHtml(frontMatter)}</code></pre>
        </div>`;
        htmlContent = frontMatterHtml + htmlContent;
    }
    
    return htmlContent;
}

// Enhanced fallback markdown parser that handles HTML tags properly
function fallbackMarkdownToHtml(content) {
    if (!content) return '';
    
    // First, escape any HTML tags that should be displayed as text
    // But preserve basic markdown
    let processed = content;
    
    // Convert headers
    processed = processed.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    processed = processed.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    processed = processed.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Convert code blocks (multiline)
    processed = processed.replace(/```([^]*?)```/g, (match, code) => {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Convert inline code
    processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert blockquotes
    processed = processed.replace(/^> (.+$)/gm, '<blockquote><p>$1</p></blockquote>');
    
    // Convert bold and italic
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    
    // Convert numbered lists
    processed = processed.replace(/^(\d+)\. (.+$)/gm, '<ol><li>$2</li></ol>');
    // Merge consecutive ol elements
    processed = processed.replace(/<\/ol>\s*<ol>/g, '');
    
    // Convert bullet lists
    processed = processed.replace(/^[-*] (.+$)/gm, '<ul><li>$1</li></ul>');
    // Merge consecutive ul elements
    processed = processed.replace(/<\/ul>\s*<ul>/g, '');
    
    // Convert links
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Convert paragraphs (split by double newlines and wrap in <p> tags)
    const paragraphs = processed.split(/\n\s*\n/);
    processed = paragraphs.map(paragraph => {
        paragraph = paragraph.trim();
        if (!paragraph) return '';
        
        // Don't wrap headers, lists, code blocks, or blockquotes in paragraph tags
        if (paragraph.match(/^<(h[1-6]|pre|ul|ol|blockquote)/)) {
            return paragraph;
        }
        
        // Replace single newlines with <br> within paragraphs
        const withBreaks = paragraph.replace(/\n/g, '<br>');
        return `<p>${withBreaks}</p>`;
    }).filter(p => p).join('\n\n');
    
    return processed;
}

// Apply syntax highlighting to code blocks
function applySyntaxHighlighting() {
    if (typeof hljs !== 'undefined') {
        // Highlight all code blocks
        document.querySelectorAll('.modal-markdown-content pre code').forEach(block => {
            hljs.highlightElement(block);
        });
        
        // Also highlight inline code if it looks like code
        document.querySelectorAll('.modal-markdown-content code:not(pre code)').forEach(block => {
            // Only highlight if it contains programming-like content
            if (block.textContent.includes('(') || block.textContent.includes('{') || 
                block.textContent.includes('function') || block.textContent.includes('const') ||
                block.textContent.includes('let') || block.textContent.includes('var')) {
                hljs.highlightElement(block);
            }
        });
    } else {
        console.log('Highlight.js not available - skipping syntax highlighting');
    }
}

// Navigate to adjacent item in modal
function navigateToAdjacentItem(direction) {
    if (!currentModalItem || !filteredData.length) return;
    
    // Find current item index in filtered data
    const currentIndex = filteredData.findIndex(item => 
        item.title === currentModalItem.title && 
        item.file === currentModalItem.file &&
        item.type === currentModalItem.type
    );
    
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'next') {
        newIndex = currentIndex + 1;
        if (newIndex >= filteredData.length) {
            newIndex = 0; // Wrap to beginning
        }
    } else if (direction === 'previous') {
        newIndex = currentIndex - 1;
        if (newIndex < 0) {
            newIndex = filteredData.length - 1; // Wrap to end
        }
    } else {
        return;
    }
    
    const newItem = filteredData[newIndex];
    if (newItem) {
        // Update modal with new item
        showPreviewModal(newItem);
    }
}

// Show preview modal
async function showPreviewModal(item) {
    // Hide any open tooltip first
    hideTooltipPreview();
    
    // Store current item for source toggle
    currentModalItem = item;
    isSourceView = false;
    
    const modal = document.getElementById('preview-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalInstall = document.getElementById('modal-install');
    const showSourceBtn = document.getElementById('modal-show-source');
    
    // Set up modal
    const currentIndex = filteredData.findIndex(dataItem => 
        dataItem.title === item.title && 
        dataItem.file === item.file &&
        dataItem.type === item.type
    );
    const position = currentIndex >= 0 ? ` (${currentIndex + 1} of ${filteredData.length})` : '';
    modalTitle.textContent = `Preview: ${item.title}${position}`;
    modalInstall.href = item.vscodeUrl;
    modalContent.innerHTML = '<div class="loading">Loading content...</div>';
    showSourceBtn.textContent = 'Show Source';
    
    // Show modal
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus management - focus the modal content instead of close button
    modalContent.focus();
    
    try {
        const content = await fetchMarkdownContent(item.sourceUrl);
        const htmlContent = markdownToHtml(content);
        modalContent.innerHTML = htmlContent || '<p>No content available.</p>';
        
        // Apply syntax highlighting to code blocks
        applySyntaxHighlighting();
        
        // Generate table of contents
        generateTableOfContents();
        
        // Set up frontmatter visibility based on scroll position
        setupFrontmatterVisibility();
        
        // Hide tooltip when modal is open
        hideTooltipPreview();
    } catch (error) {
        modalContent.innerHTML = `<div class="error">Error loading content: ${error.message}</div>`;
    }
    
    trackEvent('Preview', 'modal_open', item.type);
}

// Toggle between rendered and source view
async function toggleSourceView() {
    if (!currentModalItem) return;
    
    const modalContent = document.getElementById('modal-content');
    const showSourceBtn = document.getElementById('modal-show-source');
    const tocContainer = document.getElementById('modal-toc');
    
    if (isSourceView) {
        // Switch to rendered view
        modalContent.innerHTML = '<div class="loading">Loading content...</div>';
        showSourceBtn.textContent = 'Show Source';
        
        // Keep TOC visible
        tocContainer.style.display = 'block';
        
        try {
            const content = await fetchMarkdownContent(currentModalItem.sourceUrl);
            const htmlContent = markdownToHtml(content);
            modalContent.innerHTML = htmlContent || '<p>No content available.</p>';
            
            // Apply syntax highlighting to code blocks
            applySyntaxHighlighting();
            
            // Generate table of contents for rendered view
            generateTableOfContents();
            
            // Set up frontmatter visibility
            setupFrontmatterVisibility();
        } catch (error) {
            modalContent.innerHTML = `<div class="error">Error loading content: ${error.message}</div>`;
        }
        
        isSourceView = false;
    } else {
        // Switch to source view
        modalContent.innerHTML = '<div class="loading">Loading source...</div>';
        showSourceBtn.textContent = 'Show Rendered';
        
        // Keep TOC visible in source view
        tocContainer.style.display = 'block';
        
        try {
            const content = await fetchMarkdownContent(currentModalItem.sourceUrl);
            modalContent.innerHTML = `<pre><code class="language-markdown">${escapeHtml(content)}</code></pre>`;
            
            // Apply syntax highlighting to the markdown source
            applySyntaxHighlighting();
        } catch (error) {
            modalContent.innerHTML = `<div class="error">Error loading source: ${error.message}</div>`;
        }
        
        isSourceView = true;
    }
}

// Hide preview modal
function hidePreviewModal() {
    const modal = document.getElementById('preview-modal');
    const tocContainer = document.getElementById('modal-toc');
    const modalContent = document.getElementById('modal-content');
    
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    
    // Clean up event listeners
    const contentContainer = modalContent?.parentElement;
    if (contentContainer?._frontmatterScrollHandler) {
        contentContainer.removeEventListener('scroll', contentContainer._frontmatterScrollHandler);
        delete contentContainer._frontmatterScrollHandler;
    }
    if (contentContainer?._tocScrollHandler) {
        contentContainer.removeEventListener('scroll', contentContainer._tocScrollHandler);
        delete contentContainer._tocScrollHandler;
    }
    
    // Reset state
    currentModalItem = null;
    isSourceView = false;
    
    // Keep TOC visible for next time - don't hide it
    if (tocContainer) {
        tocContainer.style.display = 'block';
    }
}

// Show tooltip preview
async function showTooltipPreview(item, targetElement) {
    hideTooltipPreview(); // Hide any existing tooltip
    
    const tooltip = document.getElementById('preview-tooltip');
    const tooltipTitle = tooltip.querySelector('.tooltip-title');
    const tooltipDescription = tooltip.querySelector('.tooltip-description');
    const tooltipPreview = tooltip.querySelector('.tooltip-preview');
    
    // Set up tooltip content
    tooltipTitle.textContent = item.title;
    tooltipDescription.textContent = item.description || 'No description available';
    tooltipPreview.innerHTML = 'Loading preview...';
    
    // Position and show tooltip
    positionTooltip(tooltip, targetElement);
    tooltip.classList.add('show');
    tooltip.setAttribute('aria-hidden', 'false');
    
    try {
        const content = await fetchMarkdownContent(item.sourceUrl);
        // Show first few lines as preview
        const lines = content.replace(/^---[\s\S]*?---\n?/, '').split('\n');
        const preview = lines.slice(0, 8).join('\n').substring(0, 300);
        const truncated = preview.length === 300 || lines.length > 8;
        tooltipPreview.textContent = preview + (truncated ? '...' : '');
    } catch (error) {
        tooltipPreview.textContent = 'Preview unavailable';
    }
    
    currentTooltip = tooltip;
    trackEvent('Preview', 'tooltip_show', item.type);
}

// Hide tooltip preview
function hideTooltipPreview() {
    if (currentTooltip) {
        currentTooltip.classList.remove('show');
        currentTooltip.setAttribute('aria-hidden', 'true');
        currentTooltip = null;
    }
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
    }
}

// Position tooltip
function positionTooltip(tooltip, targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Position above the target element
    let top = rect.top - tooltipRect.height - 10;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    
    // Adjust if tooltip would go off screen
    if (top < 10) {
        top = rect.bottom + 10;
        // Flip arrow to top
        tooltip.querySelector('.tooltip-arrow').style.transform = 'translateX(-50%) rotate(180deg)';
        tooltip.querySelector('.tooltip-arrow').style.top = '-6px';
        tooltip.querySelector('.tooltip-arrow').style.bottom = 'auto';
    }
    
    if (left < 10) {
        left = 10;
    } else if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    
    tooltip.style.top = `${top + window.scrollY}px`;
    tooltip.style.left = `${left}px`;
}

// Setup modal event listeners
function setupModalEventListeners() {
    const modal = document.getElementById('preview-modal');
    const modalOverlay = modal.querySelector('.modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalCloseFooter = document.getElementById('modal-close-footer');
    const showSourceBtn = document.getElementById('modal-show-source');
    
    // Close modal events
    modalOverlay.addEventListener('click', hidePreviewModal);
    modalClose.addEventListener('click', hidePreviewModal);
    modalCloseFooter.addEventListener('click', hidePreviewModal);
    
    // Show source toggle
    showSourceBtn.addEventListener('click', toggleSourceView);
    
    // Prevent modal content clicks from closing modal
    modal.querySelector('.modal-content').addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Focus trap for modal
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hidePreviewModal();
            return;
        }
        
        if (e.key === 'Tab') {
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Add some performance optimizations
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Note: We're not actually registering a service worker yet,
        // but this shows where it would go for future enhancement
    });
}

// Set up frontmatter visibility based on scroll position
function setupFrontmatterVisibility() {
    const frontmatterSection = document.getElementById('frontmatter-section');
    const modalContent = document.getElementById('modal-content');
    const contentContainer = modalContent.parentElement;
    
    if (!frontmatterSection || !contentContainer) return;
    
    // Function to handle scroll and show/hide frontmatter
    const handleFrontmatterScroll = () => {
        const scrollTop = contentContainer.scrollTop;
        
        // Show frontmatter when scrolled up (near the top)
        if (scrollTop <= 50) {
            frontmatterSection.classList.add('visible');
        } else {
            frontmatterSection.classList.remove('visible');
        }
    };
    
    // Initially show frontmatter if at top
    handleFrontmatterScroll();
    
    // Add scroll listener
    contentContainer.addEventListener('scroll', handleFrontmatterScroll);
    
    // Store reference for cleanup
    contentContainer._frontmatterScrollHandler = handleFrontmatterScroll;
}

// Table of Contents functionality
function generateTableOfContents() {
    const modalContent = document.getElementById('modal-content');
    const tocContainer = document.getElementById('modal-toc');
    const tocNav = document.getElementById('modal-toc-nav');
    
    // Find all headings in the content
    const headings = modalContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
        tocContainer.style.display = 'none';
        return;
    }
    
    // Generate unique IDs for headings and build TOC structure
    const tocItems = [];
    let tocHtml = '<ul>';
    
    headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.substr(1));
        const text = heading.textContent.trim();
        const id = `heading-${index}`;
        
        // Add ID to heading for linking
        heading.id = id;
        
        // Create TOC entry
        const tocItem = {
            id,
            text,
            level,
            element: heading
        };
        tocItems.push(tocItem);
        
        tocHtml += `<li><a href="#${id}" class="toc-h${level}" data-target="${id}">${escapeHtml(text)}</a></li>`;
    });
    
    tocHtml += '</ul>';
    tocNav.innerHTML = tocHtml;
    tocContainer.style.display = 'block';
    
    // Set up click handlers for TOC links
    tocNav.addEventListener('click', (e) => {
        if (e.target.matches('a[data-target]')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                // Smooth scroll to target
                targetElement.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update active state
                updateActiveTocItem(targetId);
            }
        }
    });
    
    // Set up scroll listener for automatic highlighting
    const contentContainer = modalContent.parentElement;
    
    // Remove any existing TOC scroll listener before adding new one
    if (contentContainer._tocScrollHandler) {
        contentContainer.removeEventListener('scroll', contentContainer._tocScrollHandler);
    }
    
    // Create and store the scroll handler for cleanup
    const tocScrollHandler = throttle(updateTocOnScroll, 100);
    contentContainer._tocScrollHandler = tocScrollHandler;
    contentContainer.addEventListener('scroll', tocScrollHandler);
    
    // Initial active state
    updateTocOnScroll();
}

// Update active TOC item based on scroll position
function updateTocOnScroll() {
    const modalContent = document.getElementById('modal-content');
    const tocNav = document.getElementById('modal-toc-nav');
    const headings = modalContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const contentContainer = modalContent.parentElement;
    
    if (!headings.length) return;
    
    const scrollTop = contentContainer.scrollTop;
    const containerHeight = contentContainer.clientHeight;
    
    // Find the currently visible heading
    let activeHeading = null;
    let minDistance = Infinity;
    
    headings.forEach(heading => {
        const rect = heading.getBoundingClientRect();
        const containerRect = contentContainer.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;
        
        // Check if heading is in the top third of the viewport
        if (relativeTop >= 0 && relativeTop <= containerHeight / 3) {
            if (relativeTop < minDistance) {
                minDistance = relativeTop;
                activeHeading = heading;
            }
        }
    });
    
    // Fallback: if no heading in top third, use the first one above the viewport
    if (!activeHeading) {
        for (let i = headings.length - 1; i >= 0; i--) {
            const heading = headings[i];
            const rect = heading.getBoundingClientRect();
            const containerRect = contentContainer.getBoundingClientRect();
            const relativeTop = rect.top - containerRect.top;
            
            if (relativeTop < 0) {
                activeHeading = heading;
                break;
            }
        }
    }
    
    // Update active state in TOC
    if (activeHeading) {
        updateActiveTocItem(activeHeading.id);
    }
}

// Update active TOC item
function updateActiveTocItem(activeId) {
    const tocNav = document.getElementById('modal-toc-nav');
    const tocLinks = tocNav.querySelectorAll('a');
    
    tocLinks.forEach(link => {
        if (link.getAttribute('data-target') === activeId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Analytics hook (placeholder for future use)
function trackEvent(category, action, label) {
    // Placeholder for analytics integration
    console.log('Analytics:', { category, action, label });
}

// Track search usage
searchInput.addEventListener('input', () => {
    if (searchInput.value.length > 2) {
        trackEvent('Search', 'query', searchInput.value.length);
    }
});

// Track filter usage
typeFilter.addEventListener('change', () => {
    trackEvent('Filter', 'type', typeFilter.value);
});