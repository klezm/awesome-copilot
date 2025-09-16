import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const dataDir = path.join(process.cwd(), '..');
const contentDirs = ['chatmodes', 'instructions', 'prompts'];

export interface Item {
  slug: string;
  title: string;
  content: string;
  category: string;
  lastModified: number;
  [key:string]: any;
}

export interface FilterOption {
    value: string;
    count: number;
}

export interface Filter {
  id: string;
  name: string;
  options: FilterOption[];
}

export async function getAllItems(): Promise<{ items: Item[]; filters: Filter[] }> {
  const items: Item[] = [];
  const filterableFields: { [key: string]: { [value: string]: number } } = {};

  for (const dir of contentDirs) {
    const fullPath = path.join(dataDir, dir);
    try {
      const files = await fs.readdir(fullPath);

      for (const file of files) {
        if (path.extname(file).match(/\.(md|mdx)$/)) {
          const filePath = path.join(fullPath, file);
          const fileStat = await fs.stat(filePath);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const { data, content } = matter(fileContent);

          const slug = file.replace(/\.(md|mdx)$/, '');
          const title = data.title || slug.replace(/-/g, ' ');

          const item: Item = {
            slug: `${dir}/${slug}`,
            title,
            content,
            category: dir,
            lastModified: fileStat.mtime.getTime(),
            ...data,
          };
          items.push(item);

          // Collect filterable fields from frontmatter
          const allData = { ...data, category: dir };
          for (const key in allData) {
            if (key !== 'title' && key !== 'description' && allData[key]) {
              if (!filterableFields[key]) {
                filterableFields[key] = {};
              }
              const values = Array.isArray(allData[key]) ? allData[key] : [allData[key]];
              values.forEach(value => {
                const v = String(value);
                filterableFields[key][v] = (filterableFields[key][v] || 0) + 1;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${fullPath}:`, error);
    }
  }

  const filters: Filter[] = Object.entries(filterableFields).map(([id, optionsObj]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    options: Object.entries(optionsObj)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value)),
  }));

  // Sort items by last modified date by default
  items.sort((a, b) => b.lastModified - a.lastModified);

  return { items, filters };
}
