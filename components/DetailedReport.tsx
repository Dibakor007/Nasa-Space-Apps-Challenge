import React from 'react';
import { DetailedReportItem } from '../types';
import { LinkIcon } from './icons/LinkIcon';

interface DetailedReportProps {
  report: DetailedReportItem[];
}

const DetailItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row">
    <dt className="font-semibold text-gray-800 dark:text-space-text w-full sm:w-40 flex-shrink-0">{label}</dt>
    <dd className="text-gray-600 dark:text-space-text-dim mt-1 sm:mt-0">{value}</dd>
  </div>
);

const DetailedReport: React.FC<DetailedReportProps> = ({ report }) => {
  if (!report || report.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-space-dark/50 p-6 rounded-lg shadow-md dark:shadow-lg border border-gray-200 dark:border-space-blue/30">
      <h3 className="text-xl font-bold font-display text-space-light-blue mb-4">Detailed Report</h3>
      <div className="space-y-6">
        {report.map((item, index) => (
          <div key={index} className="border-t border-gray-200 dark:border-space-blue/30 pt-6">
            <h4 className="font-bold text-lg text-gray-900 dark:text-space-text mb-3">{item.title}</h4>
            <dl className="space-y-2 text-sm">
              <DetailItem label="Year" value={item.year} />
              <DetailItem label="Organism" value={item.organism} />
              <DetailItem label="Mission/Experiment" value={item.mission_or_experiment} />
              <DetailItem label="Main Findings" value={item.main_findings} />
            </dl>
            {item.source_url && (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-space-light-blue hover:bg-blue-600 transition-colors"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                View Source at NASA
              </a>
            )}
             {!item.source_url && (
                <p className="mt-4 text-xs text-gray-500 dark:text-space-text-dim italic">(no NASA reference found)</p>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailedReport;