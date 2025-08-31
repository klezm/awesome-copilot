# PR Preview Deployments

This document explains how pull request preview deployments and manual commit deployments work in this repository using GitHub Actions with multiple deployment targets.

## Overview

When you create a pull request, a unified GitHub Actions workflow automatically builds your changes and conditionally deploys them to GitHub Pages (for production), Vercel (for preview deployments), and Netlify (for additional preview deployments). This approach provides multiple preview URLs for reviewers while maintaining the existing GitHub Pages deployment for the main site.

Additionally, maintainers can manually deploy any commit SHA to a preview environment for testing and review purposes.

## How It Works

### Unified GitHub Actions Workflow

The deployment process is handled by the `.github/workflows/deploy-pages.yml` workflow with four separate jobs:

1. **Trigger**: Runs on every push to `main` branch and on all pull requests
2. **Build Job**: Executes the standard build commands once:
   ```bash
   npm run build
   npm run build:website
   ```
3. **Deploy-Vercel Job**: Runs independently to handle Vercel deployments (if Vercel secrets are configured)
4. **Deploy-Netlify Job**: Runs independently to handle Netlify deployments (if Netlify secrets are configured)
5. **Deploy-Pages Job**: Runs independently to deploy to GitHub Pages (when merging to `main` branch)
6. **Preview URLs**: Posts Vercel and Netlify preview URLs as comments on pull requests
7. **Automatic Updates**: Every new push triggers fresh deployments

### Benefits of Unified Workflow

This unified approach with separate build and deployment jobs provides several advantages:

- **Efficiency**: Single build process serves all deployment targets
- **Separation of Concerns**: Build, Vercel deployment, Netlify deployment, and GitHub Pages deployment run as independent jobs
- **Consistency**: Same build artifacts used for GitHub Pages, Vercel, and Netlify
- **Resource Optimization**: Reduces CI/CD time and resource usage while maintaining modularity
- **Flexibility**: Vercel and Netlify previews are optional - workflow works even without their secrets
- **Maintainability**: Clear separation between build and deployment responsibilities
- **Multiple Preview Options**: Provides both Vercel and Netlify preview deployments for comprehensive testing

### Manual Commit SHA Deployments

Maintainers can manually deploy any commit SHA to GitHub Pages for testing and review purposes. This feature is useful for:

- **Testing Historical Commits**: Deploy and test any specific commit from the repository history
- **Hotfix Validation**: Deploy and validate hotfix commits before merging
- **Rollback Testing**: Test reverting to a previous known-good state
- **Feature Branch Testing**: Deploy specific commits from feature branches for stakeholder review

#### How to Use Manual Deployments

1. **Navigate to Actions**: Go to the repository's Actions tab
2. **Select Workflow**: Click on the "Deploy Website" workflow
3. **Run Workflow**: Click "Run workflow" button on the right side
4. **Provide Commit SHA**: 
   - Enter the full 40-character commit SHA in the `commit_sha` input field
   - Leave the field empty to deploy the current commit
   - Optionally enable `force-deploy` if deploying from a non-main branch
5. **Deploy**: Click "Run workflow" to start the deployment

#### Preview URLs

Manual deployments are published to: `https://klezm.github.io/awesome-copilot/previews/<sha>/`

Where `<sha>` is the full 40-character commit SHA. For example:
- `https://klezm.github.io/awesome-copilot/previews/abc123def456789012345678901234567890abcd/`

#### Cleanup

- Manual preview deployments are automatically cleaned up after 30 days
- All preview deployments (both PR and manual) are listed at: `https://klezm.github.io/awesome-copilot/previews/`

### Vercel Configuration

The repository uses `vercel.json` for static configuration:

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

This configuration serves the built files from the `docs` directory with proper routing.

### Netlify Configuration

Netlify deployments are handled directly through the GitHub Actions workflow using the `nwtgck/actions-netlify` action. This action automatically deploys the built files from the `docs` directory to Netlify and provides preview URLs for pull requests.

No additional configuration files are required for Netlify deployment, as the action handles the deployment process directly with the following settings:

- **Publish Directory**: `docs` (where build artifacts are stored)
- **Production Branch**: `main` 
- **Deploy Message**: Includes PR number for easy identification
- **Preview Mode**: Only deploys for pull requests, not production

## For Contributors

### Using Preview Deployments

1. **Create a PR**: Open a pull request with your changes
2. **Wait for Workflow**: GitHub Actions will automatically start building and deploying
3. **Check Status**: Monitor the workflow status in the "Actions" tab or PR checks
4. **Access Preview**: Click the preview URL posted by the workflow bot in PR comments
5. **Test Changes**: Verify your changes work correctly in the live preview
6. **Automatic Updates**: New pushes automatically trigger updated previews

### Preview URLs

Preview URLs are generated by both Vercel and Netlify (if configured) and posted as separate comments on pull requests:

**Vercel URLs** typically follow this pattern:
```
https://awesome-copilot-{unique-hash}.vercel.app
```

**Netlify URLs** typically follow this pattern:
```
https://deploy-preview-{pr-number}--{site-name}.netlify.app
```

### Workflow Status

You can monitor deployment status in several ways:
- **PR Checks**: Look for the "Deploy Website" check with four separate jobs (build, deploy-vercel, deploy-netlify, deploy-pages) in the PR
- **Actions Tab**: View detailed logs for each job in the repository's Actions tab  
- **PR Comments**: The deploy-vercel and deploy-netlify jobs post preview URLs and status updates

## For Maintainers

### Required Secrets (Optional for Vercel and Netlify)

The workflow has built-in support for both Vercel and Netlify preview deployments, but both are **optional**. If their secrets are not configured, the workflow will still run successfully and deploy to GitHub Pages.

#### For Vercel Preview Deployments

Configure these GitHub repository secrets:

1. **`VERCEL_TOKEN`**: Personal access token from Vercel
   - Go to [Vercel Account Settings](https://vercel.com/account/tokens)
   - Create a new token with appropriate permissions
   - Add it as a repository secret

2. **`VERCEL_ORG_ID`**: Your Vercel organization ID
   - Found in your Vercel organization settings
   - Or run `vercel whoami` locally after linking the project

3. **`VERCEL_PROJECT_ID`**: The project ID for this repository
   - Found in your Vercel project settings
   - Or in the `.vercel/project.json` file after linking

#### For Netlify Preview Deployments

Configure these GitHub repository secrets:

1. **`NETLIFY_AUTH_TOKEN`**: Personal access token from Netlify
   - Go to [Netlify Account Settings](https://app.netlify.com/user/applications#personal-access-tokens)
   - Create a new personal access token
   - Add it as a repository secret

2. **`NETLIFY_SITE_ID`**: Your Netlify site ID
   - Found in your Netlify site settings under "Site details"
   - Or in the URL when viewing your site dashboard

**Note**: The workflow checks for the presence of `VERCEL_TOKEN` and `NETLIFY_AUTH_TOKEN` and only runs the respective deployment jobs if they're available. This allows for flexible configuration where some forks or environments may not need preview deployments.

### Setting Up Secrets

1. Go to your repository's **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each of the required secrets listed above for the platforms you want to use

### Vercel Project Setup

Before the Vercel workflow can run successfully:

1. **Link Project**: Connect your repository to a Vercel project
   ```bash
   # Locally, in the repository
   vercel link
   ```

2. **Configure Build Settings**: In Vercel dashboard, ensure:
   - Framework preset: "Other"
   - Build command: `npm run build && npm run build:website`
   - Output directory: `docs`
   - Install command: `npm ci`

### Netlify Site Setup

Before the Netlify workflow can run successfully:

1. **Create Site**: Create a new site in your Netlify dashboard
   - This can be done manually or by connecting your repository initially
   - Note the Site ID from the site settings

2. **Site Configuration**: No additional build configuration needed in Netlify dashboard as the GitHub Action handles the build and deployment process

### Managing Deployments

#### Monitoring

- **GitHub Actions**: Check workflow runs in the Actions tab
- **Vercel Dashboard**: Monitor Vercel deployments, usage, and logs
- **Netlify Dashboard**: Monitor Netlify deployments, usage, and logs
- **PR Comments**: Review automated status updates from both platforms

#### Troubleshooting

Common issues and solutions:

1. **Secret Configuration Errors**
   - Verify all required secrets are correctly set for your chosen platforms
   - Check that Vercel token has appropriate permissions
   - Check that Netlify token has appropriate permissions  
   - Ensure projects are properly linked to respective platforms

2. **Build Failures**
   - Check GitHub Actions logs for detailed error messages
   - Verify build commands work locally: `npm ci && npm run build && npm run build:website`
   - Check for missing dependencies or environment issues

3. **Deployment Failures**
   - **Vercel**: Verify project settings match workflow expectations
   - **Netlify**: Verify site ID is correct and site exists
   - Check that the output directory (`docs`) contains the built files
   - Ensure platforms are not suspended or have quota issues

4. **Missing Preview Comments**
   - Check that the workflows completed successfully
   - Verify GitHub token permissions for posting comments
   - Check if rate limits or API issues are affecting comment posting
   - Ensure secrets are properly configured for the platforms you expect to see comments from

### Workflow Customization

The workflow can be customized by editing `.github/workflows/deploy-pages.yml`:

- **Build Commands**: Modify the build steps if your process changes
- **Environment Variables**: Add additional environment variables as needed
- **Deployment Conditions**: Adjust when deployments are triggered
- **Comment Format**: Customize the preview URL comment format
- **Platform Configuration**: Enable/disable GitHub Pages, Vercel, or Netlify deployments
- **Manual Deployment Inputs**: The workflow supports these manual trigger inputs:
  - `commit_sha`: Specific commit SHA to deploy (optional)
  - `force-deploy`: Deploy to GitHub Pages even if not on main branch

## Security Considerations

### Environment Variables

- **Production Secrets**: Not available in preview deployments by default
- **Preview Variables**: Set preview-specific variables in Vercel dashboard
- **Sensitive Data**: Never commit secrets to the repository

### Access Control

- **Preview URLs**: Publicly accessible by default
- **Vercel Authentication**: Configure in Vercel dashboard if needed
- **Repository Secrets**: Properly manage access to deployment secrets

### Token Security

- **Vercel Token**: Use tokens with minimal required permissions
- **Rotation**: Regularly rotate access tokens
- **Monitoring**: Monitor token usage in Vercel dashboard

## Best Practices

### For Contributors

1. **Local Testing**: Always test `npm run build && npm run build:website` locally
2. **Monitor Workflows**: Check that deployments complete successfully
3. **Preview Testing**: Thoroughly test functionality in preview environments
4. **Resource Awareness**: Be mindful of build times and deployment frequency

### For Reviewers

1. **Use Preview URLs**: Test changes in both Vercel and Netlify preview environments if available
2. **Cross-Platform Testing**: Check desktop and mobile compatibility across different hosting platforms
3. **Performance Validation**: Verify loading times and functionality on both platforms
4. **Link Testing**: Ensure all navigation and external links work correctly across deployments

### For Maintainers

1. **Secret Management**: Regularly audit and rotate deployment secrets for all platforms
2. **Cost Monitoring**: Track Vercel and Netlify usage and deployment costs
3. **Workflow Maintenance**: Keep actions and dependencies up to date
4. **Error Monitoring**: Set up alerts for deployment failures across all platforms

## Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions for Vercel](https://vercel.com/docs/git/vercel-for-github#using-github-actions)
- [Netlify Deploy GitHub Action](https://github.com/nwtgck/actions-netlify)
- [Netlify Documentation](https://docs.netlify.com/)
- [Repository Workflow](.github/workflows/deploy-pages.yml)
- [Vercel Configuration](../vercel.json)