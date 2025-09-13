import { getCollection } from 'astro:content';

export async function getCollectionData() {
  // Fetch all documents from the 'docs' collection.
  // This includes all markdown files in `src/content/docs/`.
  const allContent = await getCollection('docs');

  // Format the content to be more easily usable and extract frontmatter.
  const formattedContent = allContent.map((item) => {
    // The slug includes the collection directory, e.g., 'chatmodes/creative'.
    // The data object contains all the frontmatter fields.
    return {
      slug: item.slug,
      ...item.data,
    };
  });

  // Dynamically identify all unique frontmatter keys and their values.
  const filterableFields: Record<string, Set<any>> = {};

  formattedContent.forEach((item) => {
    for (const key in item) {
      // These fields are standard and not used for filtering.
      if (['slug', 'title', 'description'].includes(key)) {
        continue;
      }

      // If the key is new, initialize a new Set to store its unique values.
      if (!filterableFields[key]) {
        filterableFields[key] = new Set();
      }

      // Add the value to the set for that key.
      // Sets automatically handle uniqueness.
      const value = item[key];
      if (value) {
        filterableFields[key].add(value);
      }
    }
  });

  // Convert the Sets to Arrays for easier use in components.
  const filters: Record<string, any[]> = {};
  for (const key in filterableFields) {
    filters[key] = Array.from(filterableFields[key]);
  }

  return {
    items: formattedContent,
    filters: filters,
  };
}
