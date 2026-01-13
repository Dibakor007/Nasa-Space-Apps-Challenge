import React, { useState, useCallback } from 'react';
import { AiSearchResult } from '../types';
import { getAiSummary } from '../services/geminiService';
import SearchBar from '../components/SearchBar';
import SummaryCard from '../components/SummaryCard';
import KnowledgeGraph from '../components/KnowledgeGraph';
import DataDashboard from '../components/DataDashboard';
import DetailedReport from '../components/DetailedReport';
import { LoadingIcon } from '../components/icons/LoadingIcon';
import SuggestedTopics from '../components/SuggestedTopics';
import { ClearIcon } from '../components/icons/ClearIcon';
import { allTopics } from '../constants';
import { FileTextIcon } from '../components/icons/FileTextIcon';
import { GridIcon } from '../components/icons/GridIcon';
import { PieChartIcon } from '../components/icons/PieChartIcon';

type ActiveTab = 'report' | 'graph' | 'dashboard';

interface TabButtonProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-space-accent/50 rounded-t-md
        ${
          isActive
            ? 'border-space-accent text-space-accent'
            : 'border-transparent text-gray-500 dark:text-space-text-dim hover:text-gray-700 dark:hover:text-space-text hover:border-gray-300 dark:hover:border-space-blue/50'
        }
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon}
      {label}
    </button>
  );

const ExplorePage: React.FC = () => {
  const [searchResult, setSearchResult] = useState<AiSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('report');

  const handleSearch = useCallback(async (query: string) => {
    if (!query) return;
    setIsLoading(true);
    setError(null);
    setInitialLoad(false);
    try {
      const result = await getAiSummary(query);
      setSearchResult(result);
      setActiveTab('report'); // Reset to the first tab on new search
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch AI summary. Please try again.';
      setError(message);
      setSearchResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchResult(null);
    setError(null);
    setInitialLoad(true);
  }, []);


  return (
    <div className="space-y-8 animate-fade-in-up">
      <section id="ai-search">
        <h1 className="text-4xl font-bold font-display text-gray-900 dark:text-white mb-2">AI Knowledge Search</h1>
        <p className="text-gray-700 dark:text-space-text font-semibold mb-6 text-center">Search topics to find NASA research papers, datasets, and publications.</p>
        <div className="flex items-start gap-2">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} suggestions={allTopics} />
            {searchResult && !isLoading && (
                 <button
                 onClick={handleClearSearch}
                 className="flex-shrink-0 flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-space-blue/50 text-base font-medium rounded-md text-gray-700 dark:text-space-text-dim bg-white dark:bg-space-dark hover:bg-gray-100 dark:hover:bg-space-blue/50 disabled:cursor-not-allowed transition-colors"
                 disabled={isLoading}
                 aria-label="Clear search results"
               >
                 <ClearIcon className="h-5 w-5 md:mr-2" />
                 <span className="hidden md:inline">Clear</span>
               </button>
            )}
        </div>
        
        {isLoading && (
          <div className="flex justify-center items-center mt-8 bg-gray-200 dark:bg-space-dark/50 rounded-lg p-8">
             <LoadingIcon className="h-8 w-8 text-space-light-blue" />
            <p className="ml-4 text-lg text-gray-700 dark:text-space-text">Synthesizing knowledge from the cosmos...</p>
          </div>
        )}
        {error && <p className="mt-4 text-center text-red-500 dark:text-red-400">{error}</p>}
        
        {initialLoad && !isLoading && (
            <div className="mt-8">
                <SuggestedTopics onTopicClick={handleSearch} />
            </div>
        )}
      </section>

      {searchResult && !isLoading && (
        <div className="mt-8 space-y-8">
          <SummaryCard 
              summary={searchResult.summary} 
              detailed_report={searchResult.detailed_report} 
          />

          {/* Tab Navigation */}
          <div className="border-b border-gray-300 dark:border-space-blue/50">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <TabButton
                icon={<FileTextIcon className="h-5 w-5 mr-2" />}
                label="Detailed Report"
                isActive={activeTab === 'report'}
                onClick={() => setActiveTab('report')}
              />
              <TabButton
                icon={<GridIcon className="h-5 w-5 mr-2" />}
                label="Knowledge Graph"
                isActive={activeTab === 'graph'}
                onClick={() => setActiveTab('graph')}
              />
              <TabButton
                icon={<PieChartIcon className="h-5 w-5 mr-2" />}
                label="Data Dashboard"
                isActive={activeTab === 'dashboard'}
                onClick={() => setActiveTab('dashboard')}
              />
            </nav>
          </div>

          {/* Tab Content */}
          <div className="pt-4">
            {activeTab === 'report' && <DetailedReport report={searchResult.detailed_report} />}
            
            {activeTab === 'graph' && (
              <section id="knowledge-graph">
                <p className="text-gray-600 dark:text-space-text-dim mb-6">
                  Visualize connections from your search results. Zoom, pan, and hover over nodes to explore.
                </p>
                <div className="bg-white dark:bg-space-dark/50 rounded-lg shadow-md dark:shadow-lg h-[650px] w-full border border-gray-200 dark:border-space-blue/30 overflow-hidden">
                  <KnowledgeGraph data={searchResult.graph} />
                </div>
              </section>
            )}

            {activeTab === 'dashboard' && (
              <section id="data-dashboard">
                <p className="text-gray-600 dark:text-space-text-dim mb-6">
                  Filter and explore trends from your search results.
                </p>
                <DataDashboard data={searchResult.detailed_report} />
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;