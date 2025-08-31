// Global variables
let allData = { prompts: [], instructions: [], chatmodes: [] };
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 24;

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
        
        // Handle URL-based modal opening after data is loaded
        if (window.initializeURLHandling) {
            const handled = window.initializeURLHandling();
            if (!handled) {
                // If URL handling failed (e.g., due to timing), retry after a short delay
                setTimeout(() => {
                    window.initializeURLHandling();
                }, 100);
            }
        }
        
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
            currentPage = 1;
            updateFilteredData();
        }, 300);
    });

    // Type filter
    typeFilter.addEventListener('change', () => {
        currentPage = 1;
        updateFilteredData();
    });

    // Pagination
    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateFilteredData();
            scrollToTop();
        }
    });

    nextPageButton.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updateFilteredData();
            scrollToTop();
        }
    });

    // Keyboard navigation for pagination
    document.addEventListener('keydown', (e) => {
        if (e.target.matches('input, select, button, a')) return;
        
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (e.key === 'ArrowLeft' && currentPage > 1) {
            e.preventDefault();
            currentPage--;
            updateFilteredData();
            scrollToTop();
        } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
            e.preventDefault();
            currentPage++;
            updateFilteredData();
            scrollToTop();
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
    
    updateDisplay();
}

// Update the display with current filtered data
function updateDisplay() {
    updateStats();
    renderItems();
    updatePagination();
}

// Update statistics display
function updateStats() {
    const total = filteredData.length;
    const searchTerm = searchInput.value.trim();
    const selectedType = typeFilter.value;
    
    let statsText = `Showing ${total} item${total !== 1 ? 's' : ''}`;
    
    if (searchTerm || selectedType !== 'all') {
        const filters = [];
        if (searchTerm) filters.push(`search: "${searchTerm}"`);
        if (selectedType !== 'all') filters.push(`type: ${selectedType}`);
        statsText += ` (filtered by ${filters.join(', ')})`;
    }
    
    totalCountElement.textContent = statsText;
}

// Render items for current page
function renderItems() {
    if (filteredData.length === 0) {
        showEmptyState();
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const pageItems = filteredData.slice(startIndex, endIndex);
    
    const itemsHtml = pageItems.map(item => createItemCard(item)).join('');
    resultsContainer.innerHTML = itemsHtml;
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
    
    // Store item data on the card element for click handlers
    const itemIndex = filteredData.indexOf(item);
    
    return `
        <div class="item-card" role="button" tabindex="0" aria-label="Preview ${escapeHtml(item.title)}" data-item-index="${itemIndex}">
            <div class="item-header">
                <h3 class="item-title">${escapeHtml(item.title)}</h3>
                <span class="item-type">${emoji} ${label}</span>
            </div>
            ${descriptionHtml}
            <div class="item-actions">
                <a href="${item.vscodeUrl}" class="btn btn-primary" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
                    <span class="install-badge">
                        <img src="https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white" alt="VS Code Install" />
                    </span>
                </a>
                <a href="${item.insidersUrl}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
                    <span class="install-badge">
                        <img src="https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white" alt="VS Code Insiders Install" />
                    </span>
                </a>
                <a href="${item.sourceUrl || item.link}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" title="View source on GitHub">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" style="margin-right: 0.5rem;">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    View Source on GitHub
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" style="margin-left: 0.25rem;">
                        <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                        <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                    </svg>
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
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    // Update button states
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages;
    
    // Update page info
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filteredData.length);
    pageInfoElement.textContent = `${startItem}-${endItem} of ${filteredData.length}`;
    
    // Update ARIA labels
    prevPageButton.setAttribute('aria-label', `Go to page ${currentPage - 1}`);
    nextPageButton.setAttribute('aria-label', `Go to page ${currentPage + 1}`);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Scroll to top of results
function scrollToTop() {
    const mainElement = document.getElementById('main');
    if (mainElement) {
        mainElement.scrollIntoView({ behavior: 'smooth' });
    }
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

// Modal functionality
let currentModalItem = null;
let currentRawMarkdown = null;
let currentRenderedHTML = null;
let currentCompletePreview = null;
let isShowingSource = false;
let tocObserver = null;
let currentTocHeaders = [];

// URL sharing functionality
function getItemIdFromFile(filename) {
    // Remove file extension to create a unique ID
    return filename.replace(/\.(prompt|instructions|chatmode)\.md$/, '');
}

function findItemById(itemId) {
    // Ensure allData exists and has data
    if (!allData || !itemId) {
        return null;
    }
    
    // Search through all data types to find item by ID
    const allItems = [
        ...(allData.prompts || []),
        ...(allData.instructions || []),
        ...(allData.chatmodes || [])
    ];
    
    return allItems.find(item => getItemIdFromFile(item.file) === itemId);
}

function updateURLWithModal(item, section = null, viewMode = 'preview') {
    const itemId = getItemIdFromFile(item.file);
    let url = `#item=${encodeURIComponent(itemId)}`;
    
    // Always include view mode to indicate whether we're seeing preview or source
    url += `&view=${encodeURIComponent(viewMode)}`;
    
    if (section) {
        url += `&section=${encodeURIComponent(section)}`;
    }
    
    // Update URL without triggering navigation
    history.pushState({ modalOpen: true, itemId, section, viewMode }, '', url);
}

function clearURLModal() {
    // Clear modal-related URL parameters
    history.pushState({ modalOpen: false }, '', window.location.pathname);
}

function parseURLParams() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    return {
        itemId: params.get('item'),
        section: params.get('section'),
        viewMode: params.get('view') || 'preview'  // Default to preview if not specified
    };
}

function createSectionId(headerText) {
    // Create a URL-friendly section ID from header text
    return headerText
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Create frontmatter display component
function createFrontmatterComponent(frontMatter) {
    if (!frontMatter || frontMatter.trim() === '') {
        return '';
    }
    
    return `
        <div class="frontmatter-container">
            <details class="frontmatter-details">
                <summary class="frontmatter-summary">
                    <span class="frontmatter-icon">📄</span>
                    <span class="frontmatter-title">Frontmatter</span>
                    <span class="frontmatter-toggle">▶</span>
                </summary>
                <div class="frontmatter-content">
                    <pre class="frontmatter-code"><code class="language-yaml">${escapeHtml(frontMatter)}</code></pre>
                </div>
            </details>
        </div>
    `;
}

// Simple markdown parser for fallback
function parseMarkdown(text) {
    // First escape any HTML that's not markdown syntax
    // but preserve content within code blocks and inline code
    const codeBlocks = [];
    const inlineCode = [];
    
    // Extract and preserve code blocks
    text = text.replace(/```[\s\S]*?```/g, (match, offset) => {
        codeBlocks.push(match);
        return `__CODEBLOCK_${codeBlocks.length - 1}__`;
    });
    
    // Extract and preserve inline code
    text = text.replace(/`[^`]+`/g, (match, offset) => {
        inlineCode.push(match);
        return `__INLINECODE_${inlineCode.length - 1}__`;
    });
    
    // Now escape HTML in the remaining text
    text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Process markdown syntax
    text = text
        // Headers
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        
        // Bold and italic
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        
        // Lists
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        
        // Wrap in paragraphs
        .replace(/^(?!<[hul]|<pre|<blockquote)(.+)$/gm, '<p>$1</p>')
        
        // Clean up empty paragraphs and fix nested lists
        .replace(/<p><\/p>/g, '')
        .replace(/<p>(<[hul])/g, '$1')
        .replace(/(<\/[hul]>)<\/p>/g, '$1');
    
    // Restore inline code
    inlineCode.forEach((code, index) => {
        // Remove backticks and escape HTML within
        const codeContent = code.slice(1, -1);
        text = text.replace(`__INLINECODE_${index}__`, `<code>${escapeHtml(codeContent)}</code>`);
    });
    
    // Restore code blocks
    codeBlocks.forEach((block, index) => {
        const match = block.match(/```(\w+)?\n?([\s\S]*?)```/);
        if (match) {
            const lang = match[1];
            const code = match[2];
            const langClass = lang ? ` class="language-${lang}"` : '';
            text = text.replace(`__CODEBLOCK_${index}__`, 
                `<pre><code${langClass}>${escapeHtml(code.trim())}</code></pre>`);
        }
    });
    
    return text;
}

function openPreviewModal(item, section = null, viewMode = 'preview') {
    currentModalItem = item;
    currentRawMarkdown = null;
    currentRenderedHTML = null;
    currentCompletePreview = null;
    isShowingSource = (viewMode === 'source');
    
    const modal = document.getElementById('preview-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const showSourceBtn = document.getElementById('show-source-btn');
    const toggleSourceBtn = document.getElementById('toggle-source-btn');
    
    // Set modal title
    modalTitle.textContent = item.title;
    
    // Set show source button URL
    showSourceBtn.onclick = () => {
        window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
    };
    
    // Set up toggle source button
    toggleSourceBtn.onclick = toggleSourceView;
    
    // Update button text based on initial view mode
    if (isShowingSource) {
        toggleSourceBtn.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M1 14.5V1.5a.5.5 0 0 1 .5-.5h11.793a.25.25 0 0 1 .177.427L9.854 5.041a.25.25 0 0 0 0 .354l3.616 3.614a.25.25 0 0 1-.177.427H1.5a.5.5 0 0 1-.5-.5z"/>
            </svg>
            Show Preview
        `;
    } else {
        toggleSourceBtn.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z"/>
            </svg>
            Show Source
        `;
    }
    
    // Show loading state
    modalContent.innerHTML = '<div class="loading">Loading preview...</div>';
    
    // Update URL with modal information, including view mode
    updateURLWithModal(item, section, viewMode);
    
    // Show modal
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Focus management - focus the modal content area
    modalContent.setAttribute('tabindex', '-1');
    modalContent.focus();
    
    // Load and render markdown content
    loadMarkdownContent(item, section);
    
    trackEvent('Modal', 'open', item.type);
}

function closePreviewModal() {
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentModalItem = null;
    currentRawMarkdown = null;
    currentRenderedHTML = null;
    currentCompletePreview = null;
    isShowingSource = false;
    
    // Clean up TOC observer
    if (tocObserver) {
        tocObserver.disconnect();
        tocObserver = null;
    }
    currentTocHeaders = [];
    
    // Clear URL modal parameters
    clearURLModal();
    
    trackEvent('Modal', 'close');
}

function toggleSourceView() {
    const modalContent = document.getElementById('modal-content');
    const toggleSourceBtn = document.getElementById('toggle-source-btn');
    
    if (!currentRawMarkdown && !currentCompletePreview) {
        // No content loaded yet
        return;
    }
    
    if (isShowingSource) {
        // Switch to preview mode
        if (currentCompletePreview) {
            modalContent.innerHTML = currentCompletePreview;
            
            // Re-apply syntax highlighting and header handlers
            if (typeof hljs !== 'undefined') {
                modalContent.querySelectorAll('pre code').forEach((block) => {
                    if (!block.classList.contains('hljs')) {
                        hljs.highlightElement(block);
                    }
                });
            }
            
            // Re-add header click handlers
            addHeaderClickHandlers(currentModalItem);
            
            // Regenerate TOC for preview mode
            generateTOC();
        } else {
            modalContent.innerHTML = '<div class="loading">Preview not available</div>';
        }
        toggleSourceBtn.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z"/>
            </svg>
            Show Source
        `;
        isShowingSource = false;
        // Update URL to reflect preview mode
        const { section } = parseURLParams();
        updateURLWithModal(currentModalItem, section, 'preview');
    } else {
        // Switch to source mode
        if (currentRawMarkdown) {
            modalContent.innerHTML = `<pre class="source-view"><code class="language-markdown">${escapeHtml(currentRawMarkdown)}</code></pre>`;
            // Apply syntax highlighting
            modalContent.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
            
            // Generate TOC for source mode too
            generateTOCFromMarkdown(currentRawMarkdown);
        } else {
            modalContent.innerHTML = '<div class="loading">Source not available</div>';
        }
        toggleSourceBtn.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M1 14.5V1.5a.5.5 0 0 1 .5-.5h11.793a.25.25 0 0 1 .177.427L9.854 5.041a.25.25 0 0 0 0 .354l3.616 3.614a.25.25 0 0 1-.177.427H1.5a.5.5 0 0 1-.5-.5z"/>
            </svg>
            Show Preview
        `;
        isShowingSource = true;
        // Update URL to reflect source mode
        const { section } = parseURLParams();
        updateURLWithModal(currentModalItem, section, 'source');
    }
    
    trackEvent('Modal', 'toggle-source', isShowingSource ? 'source' : 'preview');
}

async function loadMarkdownContent(item, targetSection = null) {
    const modalContent = document.getElementById('modal-content');
    
    try {
        // Construct raw GitHub URL
        const rawUrl = `https://raw.githubusercontent.com/klezm/awesome-copilot/main/${item.link}`;
        
        const response = await fetch(rawUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let markdownText = await response.text();
        
        // Store the original raw markdown (including front matter)
        currentRawMarkdown = markdownText;
        
        // Extract front matter if present
        let frontMatter = '';
        if (markdownText.startsWith('---')) {
            const frontMatterEnd = markdownText.indexOf('---', 3);
            if (frontMatterEnd !== -1) {
                frontMatter = markdownText.substring(3, frontMatterEnd).trim();
                markdownText = markdownText.substring(frontMatterEnd + 3).trim();
            }
        }
        
        let htmlContent;
        
        // Check if marked library is available (fallback to CDN)
        if (typeof marked !== 'undefined') {
            // Configure marked options
            const renderer = new marked.Renderer();
            marked.setOptions({
                breaks: true,
                gfm: true,
                renderer: renderer
            });
            
            // Parse and render markdown
            htmlContent = marked.parse(markdownText);
        } else {
            // Use built-in parser if marked is not available
            htmlContent = parseMarkdown(markdownText);
        }
        
        // Store the rendered HTML
        currentRenderedHTML = htmlContent;
        
        // Display content based on current view mode
        if (isShowingSource) {
            // Show source view
            modalContent.innerHTML = `<pre class="source-view"><code class="language-markdown">${escapeHtml(currentRawMarkdown)}</code></pre>`;
            // Apply syntax highlighting if available
            if (typeof hljs !== 'undefined') {
                modalContent.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
            }
        } else {
            // Show preview
            const frontmatterHtml = createFrontmatterComponent(frontMatter);
            const completePreviewContent = frontmatterHtml + htmlContent;
            modalContent.innerHTML = completePreviewContent;
            
            // Store the complete preview content for later use in toggleSourceView
            currentCompletePreview = completePreviewContent;
            
            // Apply basic syntax highlighting if hljs is available
            if (typeof hljs !== 'undefined') {
                modalContent.querySelectorAll('pre code').forEach((block) => {
                    if (!block.classList.contains('hljs')) {
                        hljs.highlightElement(block);
                    }
                });
            } else {
                // Add basic styling to code blocks
                modalContent.querySelectorAll('pre code').forEach((block) => {
                    block.style.display = 'block';
                    block.style.padding = '0.5rem';
                    block.style.background = '#f6f8fa';
                    block.style.borderRadius = '3px';
                    block.style.fontSize = '0.875rem';
                    block.style.fontFamily = 'Consolas, Monaco, "Courier New", monospace';
                });
            }
            
            // Add clickable header functionality and IDs (only in preview mode)
            addHeaderClickHandlers(item);
            
            // Generate TOC for preview mode
            generateTOC();
            
            // Scroll to target section if specified (only in preview mode)
            if (targetSection) {
                scrollToSection(targetSection);
            }
        }
        
    } catch (error) {
        console.error('Error loading markdown content:', error);
        modalContent.innerHTML = `
            <div class="loading">
                <p style="color: #d73a49;">❌ Failed to load content: ${escapeHtml(error.message)}</p>
                <p>You can view the source directly on <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
            </div>
        `;
    }
}

function addHeaderClickHandlers(item) {
    const modalContent = document.getElementById('modal-content');
    const headers = modalContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headers.forEach(header => {
        const headerText = header.textContent.trim();
        const sectionId = createSectionId(headerText);
        
        // Add ID to header for scrolling
        header.id = sectionId;
        
        // Make header clickable
        header.style.cursor = 'pointer';
        header.title = 'Click to copy link to this section';
        
        // Add click handler
        header.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get current view mode
            const currentViewMode = isShowingSource ? 'source' : 'preview';
            
            // Update URL with section, preserving current view mode
            updateURLWithModal(item, sectionId, currentViewMode);
            
            // Visual feedback - briefly highlight the header
            header.style.backgroundColor = '#fff3cd';
            setTimeout(() => {
                header.style.backgroundColor = '';
            }, 1000);
            
            // Scroll to the header smoothly
            header.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            // Optional: Copy URL to clipboard
            if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    console.log('Section URL copied to clipboard');
                }).catch(err => {
                    console.log('Failed to copy URL:', err);
                });
            }
            
            trackEvent('Modal', 'section-click', sectionId);
        });
        
        // Add visual indicator that header is clickable
        header.addEventListener('mouseenter', () => {
            header.style.backgroundColor = '#f8f9fa';
        });
        
        header.addEventListener('mouseleave', () => {
            header.style.backgroundColor = '';
        });
    });
}

function scrollToSection(sectionId) {
    // Small delay to ensure content is fully rendered
    setTimeout(() => {
        const targetElement = document.getElementById(sectionId);
        if (targetElement) {
            targetElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            // Briefly highlight the target section
            targetElement.style.backgroundColor = '#fff3cd';
            setTimeout(() => {
                targetElement.style.backgroundColor = '';
            }, 2000);
        }
    }, 100);
}

function generateTOC() {
    const tocList = document.getElementById('toc-list');
    const modalContent = document.getElementById('modal-content');
    
    if (!tocList || !modalContent) {
        return;
    }
    
    // Clear existing TOC
    tocList.innerHTML = '';
    currentTocHeaders = [];
    
    // Find all headers in the content
    const headers = modalContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headers.length === 0) {
        // Show empty state
        tocList.innerHTML = '<li class="toc-item"><div class="toc-empty">No headings found</div></li>';
        return;
    }
    
    headers.forEach((header, index) => {
        const level = parseInt(header.tagName.substring(1));
        const text = header.textContent.trim();
        const id = header.id || createSectionId(text);
        
        // Ensure header has an ID
        if (!header.id) {
            header.id = id;
        }
        
        // Store header reference for observer
        currentTocHeaders.push({
            element: header,
            id: id,
            level: level
        });
        
        // Create TOC item
        const listItem = document.createElement('li');
        listItem.className = 'toc-item';
        
        const link = document.createElement('a');
        link.className = `toc-link level-${level}`;
        link.href = `#${id}`;
        link.textContent = text;
        link.setAttribute('data-section-id', id);
        
        // Add click handler
        link.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToSection(id);
            
            // Update URL with section
            const currentViewMode = isShowingSource ? 'source' : 'preview';
            updateURLWithModal(currentModalItem, id, currentViewMode);
            
            trackEvent('TOC', 'section-click', id);
        });
        
        listItem.appendChild(link);
        tocList.appendChild(listItem);
    });
    
    // Set up intersection observer for active section highlighting
    setupTOCObserver();
}

function setupTOCObserver() {
    // Disconnect existing observer
    if (tocObserver) {
        tocObserver.disconnect();
    }
    
    if (currentTocHeaders.length === 0) {
        return;
    }
    
    // Create intersection observer
    const observerOptions = {
        root: document.querySelector('.modal-main'),
        rootMargin: '-100px 0px -60% 0px',
        threshold: 0
    };
    
    tocObserver = new IntersectionObserver((entries) => {
        let activeId = null;
        
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                activeId = entry.target.id;
            }
        });
        
        // Update active TOC link
        if (activeId) {
            updateActiveTOCLink(activeId);
        }
    }, observerOptions);
    
    // Observe all headers
    currentTocHeaders.forEach(header => {
        tocObserver.observe(header.element);
    });
}

function updateActiveTOCLink(activeId) {
    const tocLinks = document.querySelectorAll('.toc-link');
    
    tocLinks.forEach(link => {
        if (link.getAttribute('data-section-id') === activeId) {
            link.classList.add('active');
            
            // Scroll TOC link into view if needed
            const tocNav = document.querySelector('.toc-nav');
            if (tocNav) {
                const linkRect = link.getBoundingClientRect();
                const navRect = tocNav.getBoundingClientRect();
                
                if (linkRect.top < navRect.top || linkRect.bottom > navRect.bottom) {
                    link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }
        } else {
            link.classList.remove('active');
        }
    });
}

function toggleTOC() {
    const toc = document.getElementById('modal-toc');
    const toggle = document.getElementById('toc-toggle');
    
    if (toc && toggle) {
        toc.classList.toggle('collapsed');
        toggle.classList.toggle('collapsed');
        
        const isCollapsed = toc.classList.contains('collapsed');
        toggle.setAttribute('aria-label', isCollapsed ? 'Show table of contents' : 'Hide table of contents');
        
        trackEvent('TOC', 'toggle', isCollapsed ? 'collapsed' : 'expanded');
    }
}

function generateTOCFromMarkdown(markdownText) {
    const tocList = document.getElementById('toc-list');
    
    if (!tocList || !markdownText) {
        return;
    }
    
    // Clear existing TOC
    tocList.innerHTML = '';
    currentTocHeaders = [];
    
    // Extract headers from markdown using regex
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    const headers = [];
    let match;
    
    while ((match = headerRegex.exec(markdownText)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = createSectionId(text);
        
        headers.push({
            level: level,
            text: text,
            id: id
        });
    }
    
    if (headers.length === 0) {
        tocList.innerHTML = '<li class="toc-item"><div class="toc-empty">No headings found</div></li>';
        return;
    }
    
    headers.forEach((header, index) => {
        // Create TOC item
        const listItem = document.createElement('li');
        listItem.className = 'toc-item';
        
        const link = document.createElement('a');
        link.className = `toc-link level-${header.level}`;
        link.href = `#${header.id}`;
        link.textContent = header.text;
        link.setAttribute('data-section-id', header.id);
        
        // Add click handler (for source mode, just scroll to line)
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // For source mode, we can't really scroll to a specific line easily
            // So we'll just update the URL
            const currentViewMode = isShowingSource ? 'source' : 'preview';
            updateURLWithModal(currentModalItem, header.id, currentViewMode);
            
            // Visual feedback
            link.classList.add('active');
            setTimeout(() => {
                updateActiveTOCLink(null); // Clear all active states
            }, 1000);
            
            trackEvent('TOC', 'section-click-source', header.id);
        });
        
        listItem.appendChild(link);
        tocList.appendChild(listItem);
    });
}

// Modal event listeners
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('preview-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const backdrop = modal.querySelector('.modal-backdrop');
    
    // Close modal on close button click
    closeBtn.addEventListener('click', closePreviewModal);
    
    // Close modal on backdrop click
    backdrop.addEventListener('click', closePreviewModal);
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closePreviewModal();
        }
    });
    
    // Prevent modal content scrolling from closing modal
    modal.querySelector('.modal-container').addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // TOC toggle functionality
    const tocToggle = document.getElementById('toc-toggle');
    if (tocToggle) {
        tocToggle.addEventListener('click', toggleTOC);
    }
    
    // Add card click handlers (delegated event handling)
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.item-card');
        if (card && card.hasAttribute('data-item-index')) {
            const itemIndex = parseInt(card.getAttribute('data-item-index'));
            if (itemIndex >= 0 && itemIndex < filteredData.length) {
                openPreviewModal(filteredData[itemIndex]);
            }
        }
    });
    
    // Add keyboard navigation for cards
    document.addEventListener('keydown', (e) => {
        const card = e.target.closest('.item-card');
        if (card && card.hasAttribute('data-item-index') && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            const itemIndex = parseInt(card.getAttribute('data-item-index'));
            if (itemIndex >= 0 && itemIndex < filteredData.length) {
                openPreviewModal(filteredData[itemIndex]);
            }
        }
    });
    
    // Handle URL-based modal opening on page load
    function handleURLParams() {
        const { itemId, section, viewMode } = parseURLParams();
        
        if (itemId) {
            // Ensure data is loaded before trying to find item
            if (!allData) {
                console.warn('Data not loaded yet, will retry URL handling');
                return false; // Indicate that handling was not successful
            }
            
            const item = findItemById(itemId);
            if (item) {
                openPreviewModal(item, section, viewMode);
                return true; // Successfully handled
            } else {
                console.warn(`Item not found: ${itemId}`);
                // Clear invalid URL
                clearURLModal();
                return false;
            }
        }
        return true; // No URL parameters to handle
    }
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
        const modal = document.getElementById('preview-modal');
        const isModalOpen = modal.classList.contains('show');
        
        if (e.state && e.state.modalOpen) {
            // Should open modal
            if (!isModalOpen) {
                const { itemId, section, viewMode } = parseURLParams();
                if (itemId) {
                    const item = findItemById(itemId);
                    if (item) {
                        openPreviewModal(item, section, viewMode);
                    }
                }
            }
        } else {
            // Should close modal
            if (isModalOpen) {
                closePreviewModal();
            }
        }
    });
    
    // Initialize URL-based modal opening after data is loaded
    // This will be called from the init() function after data is loaded
    window.initializeURLHandling = handleURLParams;
});