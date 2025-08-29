// Global variables
let allData = { prompts: [], instructions: [], chatmodes: [] };
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;

// Theme system variables
let themeSettings = {
    theme: 'auto',
    syntaxTheme: 'default'
};

// DOM elements
const searchInput = document.getElementById('search');
const typeFilter = document.getElementById('type-filter');
const resultsContainer = document.getElementById('results');
const totalCountElement = document.getElementById('total-count');
const paginationContainer = document.getElementById('pagination');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const pageInfoElement = document.getElementById('page-info');

// Theme system DOM elements
const settingsButton = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModalButton = document.getElementById('close-modal');
const themeSelect = document.getElementById('theme-select');
const syntaxThemeSelect = document.getElementById('syntax-theme-select');
const resetSettingsButton = document.getElementById('reset-settings');
const saveSettingsButton = document.getElementById('save-settings');

// Initialize the application
async function init() {
    try {
        // Initialize theme system first
        initThemeSystem();
        
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

// Theme System Functions
function initThemeSystem() {
    // Load saved settings
    loadThemeSettings();
    
    // Apply initial theme
    applyTheme();
    
    // Set up theme event listeners
    setupThemeEventListeners();
}

function loadThemeSettings() {
    try {
        const saved = localStorage.getItem('awesome-copilot-settings');
        if (saved) {
            themeSettings = { ...themeSettings, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.warn('Failed to load theme settings:', error);
    }
    
    // Update UI controls
    if (themeSelect) themeSelect.value = themeSettings.theme;
    if (syntaxThemeSelect) syntaxThemeSelect.value = themeSettings.syntaxTheme;
}

function saveThemeSettings() {
    try {
        localStorage.setItem('awesome-copilot-settings', JSON.stringify(themeSettings));
        console.log('Theme settings saved');
    } catch (error) {
        console.error('Failed to save theme settings:', error);
    }
}

function applyTheme() {
    const root = document.documentElement;
    
    // Apply main theme
    if (themeSettings.theme === 'auto') {
        root.removeAttribute('data-theme');
    } else {
        root.setAttribute('data-theme', themeSettings.theme);
    }
    
    // Apply syntax theme
    root.className = root.className.replace(/syntax-theme-\w+/g, '');
    root.classList.add(`syntax-theme-${themeSettings.syntaxTheme}`);
}

function setupThemeEventListeners() {
    // Settings modal controls
    if (settingsButton) {
        settingsButton.addEventListener('click', openSettingsModal);
    }
    
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeSettingsModal);
    }
    
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                closeSettingsModal();
            }
        });
    }
    
    // Theme controls
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            themeSettings.theme = e.target.value;
            applyTheme();
        });
    }
    
    if (syntaxThemeSelect) {
        syntaxThemeSelect.addEventListener('change', (e) => {
            themeSettings.syntaxTheme = e.target.value;
            applyTheme();
        });
    }
    
    // Modal action buttons
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', () => {
            saveThemeSettings();
            closeSettingsModal();
            showNotification('Settings saved successfully!');
        });
    }
    
    if (resetSettingsButton) {
        resetSettingsButton.addEventListener('click', resetThemeSettings);
    }
    
    // Keyboard navigation for modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsModal && settingsModal.style.display === 'block') {
            closeSettingsModal();
        }
    });
}

function openSettingsModal() {
    if (settingsModal) {
        settingsModal.style.display = 'block';
        settingsModal.setAttribute('aria-hidden', 'false');
        
        // Focus the first control
        const firstControl = settingsModal.querySelector('select, button');
        if (firstControl) {
            firstControl.focus();
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
}

function closeSettingsModal() {
    if (settingsModal) {
        settingsModal.style.display = 'none';
        settingsModal.setAttribute('aria-hidden', 'true');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to settings button
        if (settingsButton) {
            settingsButton.focus();
        }
    }
}

function resetThemeSettings() {
    themeSettings = {
        theme: 'auto',
        syntaxTheme: 'default'
    };
    
    // Update UI
    if (themeSelect) themeSelect.value = themeSettings.theme;
    if (syntaxThemeSelect) syntaxThemeSelect.value = themeSettings.syntaxTheme;
    
    // Apply changes
    applyTheme();
    
    showNotification('Settings reset to defaults');
}

function showNotification(message) {
    // Simple notification - could be enhanced with a proper toast system
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--button-primary-bg);
        color: var(--button-primary-text);
        padding: 12px 16px;
        border-radius: 6px;
        z-index: 1001;
        box-shadow: 0 4px 12px var(--shadow);
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
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
                    ${escapeHtml(item.title)}
                </a>
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