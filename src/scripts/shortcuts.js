document.addEventListener('keydown', e => {
    // Focus search
    if (e.key === '/') {
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
    }

    // Toggle theme
    if (e.key === 't') {
        const themeToggle = document.querySelector('button[aria-label="Toggle theme"]');
        if (themeToggle) {
            themeToggle.click();
        }
    }

    // Escape
    if (e.key === 'Escape') {
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput && document.activeElement === searchInput) {
            searchInput.value = '';
            searchInput.blur();
            // Manually trigger input event to clear search results in Preact component
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
});
