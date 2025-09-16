import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

async function main() {
  const CWD = process.cwd();
  const websiteDir = path.join(CWD, 'website');
  const docsDir = path.join(websiteDir, 'src', 'content', 'docs');
  const sourceDirs = ['chatmodes', 'instructions', 'prompts'];

  for (const dir of sourceDirs) {
    const sourcePath = path.join(CWD, dir);
    const destPath = path.join(docsDir, dir);
    try {
      await fs.rename(sourcePath, destPath);
      console.log(`Moved ${sourcePath} to ${destPath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error moving ${sourcePath}:`, error);
      }
    }
  }

  for (const dir of sourceDirs) {
    const dirPath = path.join(docsDir, dir);
    try {
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(dirPath, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const { data, content } = matter(fileContent);

          if (!data.title) {
            const filename = path.basename(file, '.md');
            const prettyName = filename
              .replace(/\.chatmode|\.prompt|\.instructions/g, '')
              .replace(/-/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());

            const newContent = matter.stringify(content, { ...data, title: prettyName });
            await fs.writeFile(filePath, newContent);
            console.log(`Added title to ${file}`);
          }
        }
      }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`Error processing directory ${dirPath}:`, error);
        }
    }
  }
}

main().catch(console.error);
