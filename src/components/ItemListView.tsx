import { h } from 'preact';

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

const ItemListView = ({ items }: Props) => {
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
    <ul>
      {items.map(item => {
        const title = item.data.title || formatTitle(item.slug, item.collection);
        return (
          <li key={item.id} class="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <a href={`/${item.collection}/${item.slug.replace(/\.md$/, '')}`} class="text-xl font-bold text-blue-500 hover:underline">
              {title}
            </a>
            <p class="text-gray-600 dark:text-gray-400 mt-1">{item.data.description}</p>
            <p class="text-sm text-gray-500 mt-1">Type: {item.collection}</p>
          </li>
        )
      })}
    </ul>
  );
};

export default ItemListView;
