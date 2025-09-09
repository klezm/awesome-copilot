import { h } from 'preact';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: {
    prompts: boolean;
    instructions: boolean;
    chatmodes: boolean;
  };
  onFilterChange: (filters: any) => void;
}

const SearchAndFilter = ({ searchQuery, onSearchChange, filters, onFilterChange }: Props) => {
  const handleFilterChange = (e: h.JSX.TargetedEvent<HTMLInputElement>) => {
    const { name, checked } = e.currentTarget;
    onFilterChange({ ...filters, [name]: checked });
  };

  return (
    <div>
      <div class="mb-4">
        <h3 class="text-lg font-medium mb-2">Search</h3>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onInput={(e) => onSearchChange(e.currentTarget.value)}
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
        />
      </div>
      <div class="mb-4">
        <h3 class="text-lg font-medium mb-2">Filter by Type</h3>
        <div class="flex flex-col space-y-2">
          <label class="flex items-center">
            <input
              type="checkbox"
              name="prompts"
              checked={filters.prompts}
              onChange={handleFilterChange}
              class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span class="ml-2">Prompts</span>
          </label>
          <label class="flex items-center">
            <input
              type="checkbox"
              name="instructions"
              checked={filters.instructions}
              onChange={handleFilterChange}
              class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span class="ml-2">Instructions</span>
          </label>
          <label class="flex items-center">
            <input
              type="checkbox"
              name="chatmodes"
              checked={filters.chatmodes}
              onChange={handleFilterChange}
              class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span class="ml-2">Chat Modes</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilter;
