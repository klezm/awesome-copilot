import { getCollection } from 'astro:content';

export interface Item {
  slug: string;
  title: string;
  description: string;
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
  id:string;
  name: string;
  options: FilterOption[];
}

// Starlight automatically adds all files in `src/content/docs` to the `docs` collection.
// We can use `getCollection` to query all of our documents.
export async function getAllItems(): Promise<{ items: Item[]; filters: Filter[] }> {
    const allDocs = await getCollection('docs');

    // We'll filter out the index/reference pages that are not part of the main collections.
    const collectionDocs = allDocs.filter(doc =>
        doc.slug.startsWith('chatmodes/') ||
        doc.slug.startsWith('instructions/') ||
        doc.slug.startsWith('prompts/')
    );

    const items: Item[] = collectionDocs.map(doc => ({
        ...doc.data,
        slug: doc.slug,
        title: doc.data.title,
        description: doc.data.description || '',
        content: doc.body,
        category: doc.slug.split('/')[0],
        // The file modification time is not directly available here.
        // We'll rely on a frontmatter field or just sort by title.
        // For now, let's use a placeholder for lastModified.
        lastModified: 0,
    }));

    const filterableFields: { [key: string]: { [value: string]: number } } = {};

    items.forEach(item => {
        const allData = { ...item.data, category: item.category, ...item };
        for (const key in allData) {
            // Define a list of keys to exclude from filters
            const excludedKeys = ['title', 'description', 'slug', 'content', 'lastModified', 'template', 'hero'];
            if (!excludedKeys.includes(key) && allData[key]) {
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
    });

    const filters: Filter[] = Object.entries(filterableFields).map(([id, optionsObj]) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1).replace(/([A-Z])/g, ' $1'), // Add spaces for camelCase
        options: Object.entries(optionsObj)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value)),
    }));

    // Default sort by title
    items.sort((a, b) => a.title.localeCompare(b.title));

    return { items, filters };
}
