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
    
    return `
        <div class="item-card">
            <div class="item-header">
                <a href="${item.sourceUrl || item.link}" class="item-title" target="_blank" rel="noopener noreferrer">
                    ${emoji} ${escapeHtml(item.title)}
                </a>
                <span class="item-type">${label}</span>
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
                <a href="${item.sourceUrl || item.link}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">
                    View Source
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