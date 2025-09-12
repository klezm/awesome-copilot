import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Note: In Astro, `process.cwd()` is the root of the project (`/website`),
// so we go up one level to find the data directories.
const dataDir = path.join(process.cwd(), '..');
const contentDirs = ['chatmodes', 'instructions', 'prompts'];

export interface Item {
  slug: string;
  title: string;
  content: string;
  category: string; // 'chatmodes', 'instructions', or 'prompts'
  [key: string]: any;
}

export interface Filter {
  id: string;
  name: string;
  options: string[];
}

export async function getAllItems(): Promise<{ items: Item[]; filters: Filter[] }> {
  const items: Item[] = [];
  const filterableFields: { [key: string]: Set<string> } = {};

  for (const dir of contentDirs) {
    const fullPath = path.join(dataDir, dir);
    try {
      const files = await fs.readdir(fullPath);

      for (const file of files) {
        if (path.extname(file).match(/\.(md|mdx)$/)) {
          const filePath = path.join(fullPath, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const { data, content } = matter(fileContent);

          const slug = file.replace(/\.(md|mdx)$/, '');
          const title = data.title || slug.replace(/-/g, ' ');

          const item: Item = {
            slug: `${dir}/${slug}`,
            title,
            content,
            category: dir,
            ...data,
          };
          items.push(item);

          // Collect filterable fields from frontmatter
          for (const key in data) {
            // Let's create filters for these common fields, and any other non-standard ones.
            if (key !== 'title') {
              if (!filterableFields[key]) {
                filterableFields[key] = new Set();
              }
              const value = data[key];
              // Handle both single values and arrays of values
              if (Array.isArray(value)) {
                value.forEach(v => filterableFields[key].add(String(v)));
              } else {
                filterableFields[key].add(String(value));
              }
            }
          }
        }
      }
    } catch (error) {
      // If a directory doesn't exist, we'll log it but continue.
      console.error(`Error reading directory ${fullPath}:`, error);
    }
  }

  // Add category as a filter
  filterableFields['category'] = new Set(contentDirs);

  const filters: Filter[] = Object.entries(filterableFields).map(([id, optionsSet]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    options: [...optionsSet].sort(),
  }));

  return { items, filters };
}
