"use client";

import { useState, useMemo } from "react";
import data from "@/lib/data.json";
import { Book, Bot, Code, Search } from 'lucide-react';

type Item = {
  title: string;
  description: string;
  link: string;
  type: string;
  content: string;
};

const ICONS: { [key: string]: React.ElementType } = {
  prompts: Code,
  instructions: Book,
  chatmodes: Bot,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("prompts");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    return data.filter(
      (item: Item) =>
        item.type === activeTab &&
        (item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [activeTab, searchQuery]);

  const TABS = [
    { id: 'prompts', label: 'Prompts', icon: Code },
    { id: 'instructions', label: 'Instructions', icon: Book },
    { id: 'chatmodes', label: 'Chat Modes', icon: Bot },
  ];

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-800">
              Awesome Copilot
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          {/* Search and Tabs */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={`Search in ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex border-b border-gray-200">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="grid gap-4">
            {filteredData.map((item) => {
              const Icon = ICONS[item.type];
              return (
                <a
                  key={item.link}
                  href={`https://github.com/github/awesome-copilot/blob/main/${item.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="text-gray-500" size={20} />
                    <h2 className="text-lg font-semibold text-gray-800">{item.title}</h2>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                </a>
              )
            })}
             {filteredData.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500">No items found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
