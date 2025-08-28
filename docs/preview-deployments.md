# PR Preview Deployments

This document explains how pull request preview deployments work in this repository using the Vercel GitHub App.

## Overview

When you create a pull request, Vercel automatically creates a preview deployment that allows reviewers and contributors to see live versions of changes before merging. This improves collaboration and review speed by making changes easily accessible.

## How It Works

### Automatic Preview Deployments

1. **PR Creation**: When a pull request is opened, Vercel automatically triggers a preview deployment
2. **Build Process**: Vercel runs the build command defined in `vercel.json`:
   ```json
   "buildCommand": "npm run build && npm run build:website"
   ```
3. **Preview URL**: A unique preview URL is generated and posted as a comment on the PR
4. **Live Updates**: Every push to the PR branch triggers a new preview deployment

### Vercel Configuration

The repository uses the following Vercel configuration in `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "npm run build && npm run build:website",
  "outputDirectory": "docs",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "docs" }
    }
  ],
  "routes": [
    { "src": "(.*)", "dest": "/$1" }
  ]
}
```

This configuration:
- Builds the site using npm scripts
- Outputs to the `docs` directory
- Serves static files with fallback routing

## For Contributors

### Using Preview Deployments

1. **Create a PR**: Open a pull request with your changes
2. **Wait for Build**: Vercel will automatically start building your changes
3. **Access Preview**: Click the preview URL posted by Vercel bot in the PR comments
4. **Test Changes**: Verify your changes work correctly in the live preview
5. **Share with Reviewers**: Use the preview URL to demonstrate your changes

### Preview URLs

Preview URLs follow this pattern:
```
https://awesome-copilot-{branch-name}-{repo-owner}.vercel.app
```

Each PR gets a unique subdomain based on the branch name and repository owner.

## For Maintainers

### Deployment Retention Configuration

Preview deployment retention must be configured in the **Vercel Dashboard** (not in `vercel.json`). Here's how to manage it:

#### Accessing Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Navigate to the project dashboard
3. Go to **Settings** → **General** → **Deployment Protection**

#### Configuring Retention

1. **Preview Deployment Retention**: Set how long preview deployments are kept
   - Recommended: 7-30 days for active development
   - Longer retention for important branches

2. **Automatic Deletion**: Configure automatic cleanup
   - Delete previews when PR is merged/closed
   - Delete after specified time period

3. **Storage Limits**: Monitor storage usage
   - Preview deployments count toward your plan limits
   - Regular cleanup prevents hitting quotas

#### Recommended Settings

For this repository, recommended settings are:

- **Preview Retention**: 14 days
- **Auto-delete on PR close**: Enabled
- **Auto-delete on PR merge**: Enabled
- **Maximum previews per branch**: 10

### Managing Deployments

#### Vercel GitHub App Permissions

The Vercel GitHub App requires these permissions:
- Read access to repository content
- Write access to create deployment statuses
- Write access to post comments with preview URLs

#### Troubleshooting

Common issues and solutions:

1. **Build Failures**
   - Check build logs in Vercel dashboard
   - Verify `package.json` scripts work locally
   - Ensure all dependencies are properly declared

2. **Preview Not Updating**
   - Check if new commits triggered new deployments
   - Verify branch protection rules aren't blocking builds
   - Check Vercel project settings for correct branch

3. **Permissions Issues**
   - Verify Vercel GitHub App is installed and authorized
   - Check repository permissions in GitHub settings
   - Ensure Vercel team has access to the repository

## Security Considerations

### Environment Variables

- Production environment variables are not available in preview deployments
- Use preview-specific environment variables for testing
- Never expose sensitive data in preview builds

### Access Control

- Preview URLs are publicly accessible by default
- Consider enabling password protection for sensitive previews
- Use Vercel's authentication features for private repositories

## Best Practices

### For Contributors

1. **Test Locally First**: Always test changes locally before creating PR
2. **Check Preview Build**: Verify the preview deployment builds successfully
3. **Share Preview Links**: Include preview URLs in PR descriptions for easier review
4. **Monitor Build Times**: Large changes may take longer to build

### For Reviewers

1. **Use Preview URLs**: Test functionality directly in the preview environment
2. **Check Mobile/Desktop**: Verify responsive design works correctly
3. **Test Navigation**: Ensure all links and features work as expected
4. **Performance Check**: Monitor loading times and functionality

### For Maintainers

1. **Regular Monitoring**: Check Vercel dashboard for build health
2. **Cost Management**: Monitor deployment costs and storage usage
3. **Security Updates**: Keep Vercel GitHub App permissions up to date
4. **Backup Strategy**: Ensure important branches have longer retention

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [Repository vercel.json](../vercel.json)
- [GitHub Pages Maintenance Guide](MAINTENANCE.md)