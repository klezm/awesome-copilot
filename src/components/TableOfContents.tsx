import { h } from 'preact';

interface Heading {
  depth: number;
  slug: string;
  text: string;
}

interface Props {
  headings: Heading[];
}

const TableOfContents = ({ headings }: Props) => {
  const toc = headings.filter(({ depth }) => depth > 1 && depth < 4); // Only include h2 and h3
  return (
    <nav>
      <h2 class="text-xl font-bold mb-4">On this page</h2>
      <ul>
        {toc.map(heading => (
          <li key={heading.slug} style={{ marginLeft: `${(heading.depth - 2) * 1}rem` }}>
            <a href={`#${heading.slug}`} class="hover:underline">
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TableOfContents;
