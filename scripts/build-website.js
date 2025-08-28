#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Base URLs for aka.ms redirects - these are used in the main script
const AKA_INSTALL_URLS = {
  prompt: "https://aka.ms/ghcp-prompt-install",
  instructions: "https://aka.ms/ghcp-instructions-install", 
  mode: "https://aka.ms/ghcp-mode-install"
};

// Repository info - dynamically determined
function getRepositoryInfo() {
  // First try GitHub Actions environment variables
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    return {
      owner: owner,
      repo: repo,
      baseUrl: `https://github.com/${owner}/${repo}`
    };
  }
  
  // Fallback to package.json
  const packageJsonPath = path.join(__dirname, "..", "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      if (packageJson.repository && packageJson.repository.url) {
        const repoUrl = packageJson.repository.url
          .replace(/^git\+/, "")
          .replace(/\.git$/, "");
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
          return {
            owner: match[1],
            repo: match[2],
            baseUrl: repoUrl
          };
        }
      }
    } catch (error) {
      console.warn("Could not parse package.json:", error.message);
    }
  }

  // Fallback to git remote (for local development)
  try {
    const { execSync } = require('child_process');
    const remoteUrl = execSync('git remote get-url origin', { 
      encoding: 'utf8',
      cwd: __dirname 
    }).trim();
    
    const match = remoteUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+)/);
    if (match) {
      const repo = match[2].replace(/\.git$/, '');
      return {
        owner: match[1],
        repo: repo,
        baseUrl: `https://github.com/${match[1]}/${repo}`
      };
    }
  } catch (error) {
    console.warn("Could not get git remote:", error.message);
  }
  
  // Final fallback to github/awesome-copilot
  return {
    owner: "github",
    repo: "awesome-copilot", 
    baseUrl: "https://github.com/github/awesome-copilot"
  };
}

// Extract front matter from markdown files
function extractFrontMatter(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  
  if (lines[0] !== "---") {
    return {};
  }
  
  const frontMatterEnd = lines.findIndex((line, index) => index > 0 && line === "---");
  if (frontMatterEnd === -1) {
    return {};
  }
  
  const frontMatterLines = lines.slice(1, frontMatterEnd);
  const frontMatter = {};
  
  for (const line of frontMatterLines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      frontMatter[key] = value;
    }
  }
  
  return frontMatter;
}

// Extract title from markdown file
function extractTitle(filePath) {
  const frontMatter = extractFrontMatter(filePath);
  if (frontMatter.title) {
    return frontMatter.title;
  }
  
  // Fallback to filename
  const basename = path.basename(filePath);
  const nameWithoutExt = basename.replace(/\.(prompt|instructions|chatmode)\.md$/, ".md").replace(/\.md$/, "");
  return nameWithoutExt
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Extract description from markdown file  
function extractDescription(filePath) {
  const frontMatter = extractFrontMatter(filePath);
  return frontMatter.description || "";
}

/**
 * Generate JSON data for the website
 */
function generateJsonData(promptsDir, instructionsDir, chatmodesDir, repoInfo) {
  const repoBaseUrl = `${repoInfo.baseUrl}/blob/main`;
  
  const data = {
    prompts: [],
    instructions: [],
    chatmodes: [],
    repository: repoInfo
  };

  // Process prompts
  if (fs.existsSync(promptsDir)) {
    const promptFiles = fs
      .readdirSync(promptsDir)
      .filter((file) => file.endsWith(".prompt.md"))
      .sort();

    for (const file of promptFiles) {
      const filePath = path.join(promptsDir, file);
      const title = extractTitle(filePath);
      const description = extractDescription(filePath);
      const link = `prompts/${file}`;
      
      // Create install URLs using the aka.ms URLs
      const repoUrl = `${repoBaseUrl}/${link}`;
      const vscodeUrl = `${AKA_INSTALL_URLS.prompt}?url=${encodeURIComponent(`vscode:chat-prompt/install?url=${repoUrl}`)}`;
      const insidersUrl = `${AKA_INSTALL_URLS.prompt}?url=${encodeURIComponent(`vscode-insiders:chat-prompt/install?url=${repoUrl}`)}`;

      data.prompts.push({
        title,
        description: description || "",
        file,
        link,
        type: "prompts",
        vscodeUrl,
        insidersUrl
      });
    }
  }

  // Process instructions
  if (fs.existsSync(instructionsDir)) {
    const instructionFiles = fs
      .readdirSync(instructionsDir)
      .filter((file) => file.endsWith(".md"))
      .sort();

    for (const file of instructionFiles) {
      const filePath = path.join(instructionsDir, file);
      const title = extractTitle(filePath);
      const description = extractDescription(filePath);
      const link = `instructions/${file}`;
      
      // Create install URLs using the aka.ms URLs
      const repoUrl = `${repoBaseUrl}/${link}`;
      const vscodeUrl = `${AKA_INSTALL_URLS.instructions}?url=${encodeURIComponent(`vscode:chat-instructions/install?url=${repoUrl}`)}`;
      const insidersUrl = `${AKA_INSTALL_URLS.instructions}?url=${encodeURIComponent(`vscode-insiders:chat-instructions/install?url=${repoUrl}`)}`;

      data.instructions.push({
        title,
        description: description || "",
        file,
        link,
        type: "instructions",
        vscodeUrl,
        insidersUrl
      });
    }
  }

  // Process chat modes
  if (fs.existsSync(chatmodesDir)) {
    const chatmodeFiles = fs
      .readdirSync(chatmodesDir)
      .filter((file) => file.endsWith(".chatmode.md"))
      .sort();

    for (const file of chatmodeFiles) {
      const filePath = path.join(chatmodesDir, file);
      const title = extractTitle(filePath);
      const description = extractDescription(filePath);
      const link = `chatmodes/${file}`;
      
      // Create install URLs using the aka.ms URLs
      const repoUrl = `${repoBaseUrl}/${link}`;
      const vscodeUrl = `${AKA_INSTALL_URLS.mode}?url=${encodeURIComponent(`vscode:chat-mode/install?url=${repoUrl}`)}`;
      const insidersUrl = `${AKA_INSTALL_URLS.mode}?url=${encodeURIComponent(`vscode-insiders:chat-mode/install?url=${repoUrl}`)}`;

      data.chatmodes.push({
        title,
        description: description || "",
        file,
        link,
        type: "chatmodes",
        vscodeUrl,
        insidersUrl
      });
    }
  }

  return data;
}

/**
 * Update HTML template with dynamic repository links
 */
function updateHtmlTemplate(templatePath, outputPath, repoInfo) {
  if (!fs.existsSync(templatePath)) {
    console.error(`Template file not found: ${templatePath}`);
    return;
  }
  
  let htmlContent = fs.readFileSync(templatePath, "utf8");
  
  // Replace hardcoded GitHub links with dynamic ones
  const repoUrl = repoInfo.baseUrl;
  htmlContent = htmlContent.replace(
    /https:\/\/github\.com\/github\/awesome-copilot/g, 
    repoUrl
  );
  
  fs.writeFileSync(outputPath, htmlContent);
  console.log(`Updated HTML template with repository links: ${outputPath}`);
}

// Utility: write file only if content changed
function writeFileIfChanged(filePath, content) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    const original = fs.readFileSync(filePath, "utf8");
    if (original === content) {
      console.log(`${path.basename(filePath)} is already up to date. No changes needed.`);
      return;
    }
  }
  fs.writeFileSync(filePath, content);
  console.log(`${path.basename(filePath)} ${exists ? "updated" : "created"} successfully!`);
}

// Main execution
try {
  console.log("Building website...");

  const instructionsDir = path.join(__dirname, "..", "instructions");
  const promptsDir = path.join(__dirname, "..", "prompts");
  const chatmodesDir = path.join(__dirname, "..", "chatmodes");
  const docsDir = path.join(__dirname, "..", "docs");

  // Get repository information
  const repoInfo = getRepositoryInfo();
  console.log(`Repository: ${repoInfo.owner}/${repoInfo.repo}`);

  // Generate JSON data for website
  console.log("Generating JSON data for website...");
  const jsonData = generateJsonData(promptsDir, instructionsDir, chatmodesDir, repoInfo);
  
  // Ensure docs directory exists
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Write JSON data file
  const jsonContent = JSON.stringify(jsonData, null, 2);
  writeFileIfChanged(path.join(docsDir, "data.json"), jsonContent);
  
  // Update HTML template with dynamic repository links
  const templatePath = path.join(docsDir, "index.template.html");
  const outputPath = path.join(docsDir, "index.html");
  
  updateHtmlTemplate(templatePath, outputPath, repoInfo);
  
  // Generate summary stats
  const totalCount = jsonData.prompts.length + jsonData.instructions.length + jsonData.chatmodes.length;
  console.log(`Generated data for ${totalCount} items: ${jsonData.prompts.length} prompts, ${jsonData.instructions.length} instructions, ${jsonData.chatmodes.length} chat modes`);
  
} catch (error) {
  console.error(`Error building website: ${error.message}`);
  process.exit(1);
}