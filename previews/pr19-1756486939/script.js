// Global variables
let allData = { prompts: [], instructions: [], chatmodes: [] };
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;

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
        } else if (e.key === 'Escape') {
            hidePreviewModal();
            hideTooltipPreview();
        }
    });

    // Preview modal event listeners
    setupModalEventListeners();
    
    // Results container event delegation for preview buttons and hover
    resultsContainer.addEventListener('click', (e) => {
        if (e.target.matches('.preview-btn') || e.target.closest('.preview-btn')) {
            e.preventDefault();
            const btn = e.target.matches('.preview-btn') ? e.target : e.target.closest('.preview-btn');
            const item = JSON.parse(btn.getAttribute('data-preview-item'));
            showPreviewModal(item);
        }
    });

    // Hover events for tooltip preview
    resultsContainer.addEventListener('mouseenter', (e) => {
        if (e.target.matches('.item-card') || e.target.closest('.item-card')) {
            const card = e.target.matches('.item-card') ? e.target : e.target.closest('.item-card');
            const item = JSON.parse(card.getAttribute('data-item'));
            
            tooltipTimeout = setTimeout(() => {
                showTooltipPreview(item, card);
            }, 800); // Delay to avoid showing on quick hovers
        }
    }, true);

    resultsContainer.addEventListener('mouseleave', (e) => {
        if (e.target.matches('.item-card') || e.target.closest('.item-card')) {
            hideTooltipPreview();
        }
    }, true);
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
    
    return `
        <div class="item-card" data-item='${JSON.stringify(item).replace(/'/g, "&apos;")}'>
            <div class="item-header">
                <a href="${item.sourceUrl || item.link}" class="item-title" target="_blank" rel="noopener noreferrer">
                    ${escapeHtml(item.title)}
                </a>
                <span class="item-type">${emoji} ${label}</span>
            </div>
            ${descriptionHtml}
            <div class="item-actions">
                <button class="btn btn-secondary preview-btn" data-preview-item='${JSON.stringify(item).replace(/'/g, "&apos;")}' aria-label="Preview ${escapeHtml(item.title)}">
                    👁️ Preview
                </button>
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
                <a href="${item.sourceUrl || item.link}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">
                    📄 Source
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

// Simple markdown to HTML converter
function simpleMarkdownToHtml(markdown) {
    if (!markdown) return '';
    
    // Remove front matter
    let content = markdown.replace(/^---[\s\S]*?---\n?/, '');
    
    // Convert headers
    content = content.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    content = content.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    content = content.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Convert code blocks
    content = content.replace(/```[\s\S]*?```/g, (match) => {
        const code = match.slice(3, -3).trim();
        return `<pre><code>${escapeHtml(code)}</code></pre>`;
    });
    
    // Convert inline code
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert bold and italic
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Convert lists
    content = content.replace(/^\* (.+$)/gm, '<li>$1</li>');
    content = content.replace(/^- (.+$)/gm, '<li>$1</li>');
    content = content.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Convert paragraphs
    content = content.split('\n\n').map(paragraph => {
        paragraph = paragraph.trim();
        if (!paragraph) return '';
        if (paragraph.startsWith('<h') || paragraph.startsWith('<ul') || paragraph.startsWith('<pre')) {
            return paragraph;
        }
        return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
    
    return content;
}

// Show preview modal
async function showPreviewModal(item) {
    const modal = document.getElementById('preview-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalInstall = document.getElementById('modal-install');
    
    // Set up modal
    modalTitle.textContent = `Preview: ${item.title}`;
    modalInstall.href = item.vscodeUrl;
    modalContent.innerHTML = '<div class="loading">Loading content...</div>';
    
    // Show modal
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus management
    const modalCloseBtn = document.getElementById('modal-close');
    modalCloseBtn.focus();
    
    try {
        const content = await fetchMarkdownContent(item.sourceUrl);
        const htmlContent = simpleMarkdownToHtml(content);
        modalContent.innerHTML = htmlContent || '<p>No content available.</p>';
    } catch (error) {
        modalContent.innerHTML = `<div class="error">Error loading content: ${error.message}</div>`;
    }
    
    trackEvent('Preview', 'modal_open', item.type);
}

// Hide preview modal
function hidePreviewModal() {
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
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
    
    // Close modal events
    modalOverlay.addEventListener('click', hidePreviewModal);
    modalClose.addEventListener('click', hidePreviewModal);
    modalCloseFooter.addEventListener('click', hidePreviewModal);
    
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