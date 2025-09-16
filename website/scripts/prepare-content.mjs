import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';

const sourceBaseDir = path.resolve(process.cwd(), '..');
const destBaseDir = path.resolve(process.cwd(), 'src/content/docs');

const targetDir = process.argv[2];

if (!targetDir) {
    console.error('Please provide a target directory (e.g., chatmodes, instructions, or prompts).');
    process.exit(1);
}

const contentDirs = [targetDir];

// Function to generate a title from a filename
function generateTitle(filename) {
    const nameWithoutExt = path.parse(filename).name;
    // a readable title from the filename. e.g. "api-architect.chatmode" -> "Api Architect Chatmode"
    return nameWithoutExt
        .replace(/\.chatmode|\.instructions|\.prompt/g, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

// Function to generate a description from content
function generateDescription(content) {
    const strippedContent = content.replace(/---[\s\S]*?---/, '').replace(/#.*/g, '').replace(/[*_`[\]()#+-.!]/g, '').trim();
    const sentences = strippedContent.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length > 0) {
        return sentences.slice(0, 2).join(' ').trim();
    }
    const contentWithoutFrontmatter = content.replace(/---[\s\S]*?---/, '').trim();
    if (contentWithoutFrontmatter.length === 0) {
        return "No content available to generate a description.";
    }
    return contentWithoutFrontmatter.slice(0, 150).trim() + '...';
}

async function processFiles() {
    for (const dir of contentDirs) {
        const sourceDir = path.join(sourceBaseDir, dir);
        const destDir = path.join(destBaseDir, dir);

        await fs.ensureDir(destDir);

        const files = await fs.readdir(sourceDir);

        for (const file of files) {
            if (path.extname(file) === '.md') {
                const sourceFilePath = path.join(sourceDir, file);
                const destFilePath = path.join(destDir, file);

                const fileContent = await fs.readFile(sourceFilePath, 'utf8');
                const { data, content } = matter(fileContent);

                if (!data.title) {
                    data.title = generateTitle(file);
                }

                if (!data.description) {
                    data.description = generateDescription(content);
                }

                // Add a sidebar label for better organization in Starlight
                data.sidebar = {
                  label: data.title,
                };

                const newContent = matter.stringify(content, data);
                await fs.writeFile(destFilePath, newContent);
            }
        }
    }
    console.log(`Content preparation complete for ${targetDir}.`);
}

processFiles().catch(console.error);
