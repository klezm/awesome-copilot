# GitHub Pages Site Maintenance Guide

This document explains how to maintain and update the GitHub Pages site for the Awesome GitHub Copilot repository.

## Overview

The GitHub Pages site provides an interactive web interface for exploring the repository's prompts, instructions, and chat modes. It features:

- **Search functionality** - Search across titles and descriptions
- **Type filtering** - Filter by prompts, instructions, or chat modes
- **Responsive design** - Works on desktop and mobile devices
- **Accessibility** - Keyboard navigation and screen reader support
- **VS Code integration** - Direct installation links maintained

## Architecture

The site consists of:

1. **Static HTML/CSS/JS** (`docs/` directory)
   - `index.html` - Main page structure
   - `styles.css` - Responsive styling with dark mode support
   - `script.js` - Interactive functionality
   
2. **Data Generation** (`update-readme.js`)
   - Automatically generates `docs/data.json` from repository content
   - Extracts metadata from frontmatter
   - Creates installation URLs
   
3. **GitHub Actions** (`.github/workflows/deploy-pages.yml`)
   - Automatically builds and deploys on push to main
   - Runs the build script to generate fresh data

## How Content Updates Work

### Automatic Updates

When prompts, instructions, or chat modes are added/updated:

1. **Push to main branch** triggers the deployment workflow
2. **Build step** runs `npm run build` which:
   - Parses all `.prompt.md`, `.instructions.md`, and `.chatmode.md` files
   - Extracts titles from filenames or frontmatter `title` field
   - Extracts descriptions from frontmatter `description` field
   - Generates VS Code installation URLs
   - Creates `docs/data.json` with all content
3. **Deploy step** publishes the updated site to GitHub Pages

### Manual Updates

To update the site manually:

```bash
# Install dependencies
npm install

# Generate fresh data
npm run build

# Test locally (optional)
cd docs && python3 -m http.server 8000
```

## Adding New Content Types

To add support for new content types:

1. **Update `update-readme.js`**:
   - Add new section to `generateJsonData()` function
   - Follow the same pattern as existing types
   - Ensure proper URL generation

2. **Update the website**:
   - Add new option to type filter in `index.html`
   - Update JavaScript filter logic in `script.js`
   - Add appropriate styling in `styles.css`

## File Structure Requirements

For content to be automatically detected:

### Prompts
- **Location**: `prompts/`
- **Extension**: `.prompt.md`
- **Frontmatter**: Must include `description` field
- **Example**:
  ```yaml
  ---
  mode: 'agent'
  description: 'Create a README.md file for the project'
  tags: []
  ---
  ```

### Instructions
- **Location**: `instructions/`
- **Extension**: `.instructions.md`
- **Frontmatter**: Must include `description` and `applyTo` fields
- **Example**:
  ```yaml
  ---
  description: 'Documentation and content creation standards'
  applyTo: '**/*.md'
  tags: []
  ---
  ```

### Chat Modes
- **Location**: `chatmodes/`
- **Extension**: `.chatmode.md`
- **Frontmatter**: Must include `description` field
- **Example**:
  ```yaml
  ---
  description: 'Debug your application to find and fix a bug'
  tools: ['codebase', 'readFiles', 'editFiles']
  tags: []
  ---
  ```

## Customization

### Styling
- **Colors**: Modify CSS custom properties in `styles.css`
- **Layout**: Update CSS Grid/Flexbox properties
- **Dark mode**: Colors automatically adapt based on `prefers-color-scheme`

### Functionality
- **Search**: Modify search logic in `updateFilteredData()` function
- **Pagination**: Adjust `itemsPerPage` constant
- **Analytics**: Update `trackEvent()` function for your analytics provider

## Troubleshooting

### Site Not Updating
1. Check GitHub Actions workflow in repository
2. Verify `docs/data.json` was generated correctly
3. Ensure GitHub Pages is configured to deploy from `docs/` folder

### Content Not Appearing
1. Verify file is in correct directory with correct extension
2. Check frontmatter format (YAML with `---` delimiters)
3. Ensure `description` field is present and properly quoted

### Local Development
```bash
# Start local server
cd docs && python3 -m http.server 8000

# Or use Node.js
cd docs && npx serve

# Or use PHP
cd docs && php -S localhost:8000
```

## Performance Considerations

- **Data size**: Site loads all content at once for optimal search performance
- **Images**: Install badges are loaded from external CDN
- **Caching**: Browser caches static assets automatically
- **Search**: Uses client-side filtering with debounced input

## Security

- **CSP**: Consider adding Content Security Policy headers
- **HTTPS**: GitHub Pages automatically provides HTTPS
- **External links**: All external links use `rel="noopener noreferrer"`

## Accessibility Features

- **Keyboard navigation**: Full keyboard support for all features
- **Screen readers**: Proper ARIA labels and live regions
- **High contrast**: Respects system preferences
- **Reduced motion**: Respects user motion preferences
- **Skip links**: Skip to main content link for screen readers

## Future Enhancements

Potential improvements:
- **Service worker** for offline support
- **Advanced search** with tag/category filtering
- **Bookmarking** of search results
- **Dark/light mode toggle**
- **Export functionality** for filtered results
- **Analytics integration** for usage tracking