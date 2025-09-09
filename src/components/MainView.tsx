import { h } from 'preact';
import { useState, useMemo } from 'preact/hooks';
import SearchAndFilter from './SearchAndFilter';
import ItemListView from './ItemListView';

interface Item {
  id: string;
  slug: string;
  body: string;
  collection: string;
  data: {
    title?: string;
    description: string;
  };
}

interface Props {
  items: Item[];
}

const MainView = ({ items }: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    prompts: true,
    instructions: true,
    chatmodes: true,
  });

  const filteredItems = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();

    return items.filter(item => {
      const typeFilter = (item.collection === 'prompts' && filters.prompts) ||
                         (item.collection === 'instructions' && filters.instructions) ||
                         (item.collection === 'chatmodes' && filters.chatmodes);

      if (!typeFilter) return false;

      if (!lowercasedQuery) return true;

      const title = item.data.title || formatTitle(item.slug, item.collection);

      const match = lowercasedQuery.match(/^(?<prefix>title|description|filename|content):(?<term>.*)$/);

      if (match?.groups) {
        const { prefix, term } = match.groups;
        if (prefix === 'title') {
          return title.toLowerCase().includes(term);
        }
        if (prefix === 'description') {
          return item.data.description.toLowerCase().includes(term);
        }
        if (prefix === 'filename') {
          return item.slug.toLowerCase().includes(term);
        }
        if (prefix === 'content') {
          return item.body.toLowerCase().includes(term);
        }
      }

      return title.toLowerCase().includes(lowercasedQuery) ||
             item.data.description.toLowerCase().includes(lowercasedQuery);
    });
  }, [items, filters, searchQuery]);

  function formatTitle(slug: string, collection: string) {
    let ext = '';
    if (collection === 'prompts') {
      ext = '.prompt.md';
    } else if (collection === 'instructions') {
      ext = '.instructions.md';
    } else if (collection === 'chatmodes') {
      ext = '.chatmode.md';
    }
    const withoutExt = slug.replace(ext, '');
    return withoutExt
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return (
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside class="lg:col-span-3 p-4">
            <div class="sticky top-4">
                <SearchAndFilter
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filters={filters}
                    onFilterChange={setFilters}
                />
            </div>
        </aside>
        <main class="lg:col-span-9 p-4">
            <ItemListView items={filteredItems} />
        </main>
    </div>
  );
};

export default MainView;
