import { h, VNode } from 'preact';
import { useState } from 'preact/hooks';

interface Props {
  children: VNode<any>;
  rawContent: string;
}

const ContentDisplay = ({ children, rawContent }: Props) => {
  const [activeTab, setActiveTab] = useState('preview');

  return (
    <div>
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`${
              activeTab === 'preview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`${
              activeTab === 'raw'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Raw
          </button>
        </nav>
      </div>
      <div class="py-4">
        {activeTab === 'preview' ? (
          <div class="prose dark:prose-invert max-w-none">{children}</div>
        ) : (
          <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>{rawContent}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

export default ContentDisplay;
