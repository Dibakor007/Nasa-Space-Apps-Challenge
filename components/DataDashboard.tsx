import React, { useMemo, useEffect, useRef } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DetailedReportItem } from '../types';
import _ from 'lodash';
import { useTheme } from '../contexts/ThemeContext';
// FIX: D3 functions are imported from their specific sub-modules to resolve module errors.
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { schemeSet2 } from 'd3-scale-chromatic';
import { select } from 'd3-selection';
import 'd3-transition';
import cloud from 'd3-cloud';
import { PieChartIcon } from './icons/PieChartIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { TextIcon } from './icons/TextIcon';
import { GridIcon } from './icons/GridIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { FlaskConicalIcon } from './icons/FlaskConicalIcon';
import { RocketIcon } from './icons/RocketIcon';

// Helper to determine the best contrasting text color (light/dark) for a given background hex color.
const getContrastingTextColor = (hex: string): string => {
    if (!hex || hex.length < 7) return '#ffffff'; // Default to white for invalid inputs
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    // Formula to determine perceived brightness
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#0a192f' : '#ffffff'; // Return dark for light backgrounds, light for dark backgrounds
};

// Helper to group specific missions into broader categories for clearer charts
const generalizeMission = (mission: string): string => {
    const m = mission.toLowerCase();
    if (m.includes('iss') || m.includes('expedition')) return 'ISS';
    if (m.includes('shuttle') || m.includes('sts')) return 'Shuttle';
    if (m.includes('glds')) return 'GeneLab';
    if (m.includes('veggie')) return 'VEGGIE';
    if (m.includes('aph')) return 'APH';
    if (m.includes('rr-') || m.includes('rodent research')) return 'Rodent Research';
    if (m.includes('artemis')) return 'Artemis';
    if (m.includes('twins study')) return 'Twins Study';
    if (m === 'n/a') return 'N/A';
    return 'Other';
};

interface ChartContainerProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, description, icon, children, className = '' }) => (
    <div className={`bg-white dark:bg-space-dark/50 p-6 rounded-lg shadow-md dark:shadow-lg border border-gray-200 dark:border-space-blue/30 flex flex-col ${className}`}>
        <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 text-space-accent bg-space-accent/10 dark:bg-space-accent/20 p-2 rounded-lg">
                {icon}
            </div>
            <div>
                <h4 className="font-bold font-display text-lg text-gray-900 dark:text-space-text">{title}</h4>
                <p className="text-sm text-gray-600 dark:text-space-text-dim">{description}</p>
            </div>
        </div>
        <div className="flex-grow w-full h-full min-h-[300px]">
            {children}
        </div>
    </div>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-white dark:bg-space-dark/50 p-4 rounded-lg shadow-md dark:shadow-lg border border-gray-200 dark:border-space-blue/30 flex items-center gap-4">
        <div className="flex-shrink-0 text-space-accent bg-space-accent/10 dark:bg-space-accent/20 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <div className="text-sm font-medium text-gray-600 dark:text-space-text-dim">{label}</div>
            <div className="text-xl font-bold text-gray-900 dark:text-space-text">{value}</div>
        </div>
    </div>
);


const DataDashboard: React.FC<{ data: DetailedReportItem[] }> = ({ data }) => {
    const { theme } = useTheme();
    const wordCloudRef = useRef<SVGSVGElement>(null);

    const themeColors = {
        grid: theme === 'dark' ? '#1e3a8a' : '#e5e7eb',
        axis: theme === 'dark' ? '#8892b0' : '#6b7280',
        tooltipBg: theme === 'dark' ? '#0a192f' : '#ffffff',
        tooltipBorder: theme === 'dark' ? '#1e3a8a' : '#d1d5db',
    };

    const stats = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                totalReports: 0,
                yearRange: 'N/A',
                topOrganism: 'N/A',
                topMission: 'N/A',
            };
        }
        const years = data.map(d => d.year);
        const organismCounts = _.countBy(data, 'organism');
        const missionCounts = _.countBy(data, item => generalizeMission(item.mission_or_experiment));
    
        return {
            totalReports: data.length,
            yearRange: years.length > 1 ? `${Math.min(...years)} – ${Math.max(...years)}` : years[0],
            topOrganism: Object.keys(organismCounts).length > 0 ? Object.keys(organismCounts).reduce((a, b) => organismCounts[a] > organismCounts[b] ? a : b) : 'N/A',
            topMission: Object.keys(missionCounts).length > 0 ? Object.keys(missionCounts).reduce((a, b) => missionCounts[a] > missionCounts[b] ? a : b) : 'N/A',
        };
    }, [data]);

    // 1. Data for Mission Distribution Donut Chart
    const missionDistributionData = useMemo(() => {
        const grouped = _.groupBy(data, item => generalizeMission(item.mission_or_experiment));
        return Object.entries(grouped).map(([name, values]) => ({
            name,
            // FIX: Cast `values` to the expected array type to access its `length` property.
            value: (values as DetailedReportItem[]).length,
        })).sort((a, b) => b.value - a.value);
    }, [data]);
    const PIE_COLORS = schemeSet2;

    // 2. Data for Organism Research Trends Over Time
    const { organismTrendData, trendOrganisms } = useMemo(() => {
        if (!data.length) return { organismTrendData: [], trendOrganisms: [] };
        const organisms = _.uniq(data.map(d => d.organism));
        const groupedByYear = _.groupBy(data, 'year');
        const years = _.sortBy(Object.keys(groupedByYear).map(Number));
        
        const trendData = years.map(year => {
            const yearData = groupedByYear[year];
            const yearSummary: { year: number; [key:string]: number } = { year };
            organisms.forEach(org => {
                yearSummary[org] = _.filter(yearData, { organism: org }).length;
            });
            return yearSummary;
        });
        return { organismTrendData: trendData, trendOrganisms: organisms };
    }, [data]);

    // 3. Data for Organism vs. Mission Heatmap
    const { heatmapData, organisms, missions, maxCount } = useMemo(() => {
        if (!data.length) return { heatmapData: {}, organisms: [], missions: [], maxCount: 0 };
    
        const uniqueOrganisms = _.sortBy(_.uniq(data.map(d => d.organism)));
        const uniqueMissions = _.sortBy(_.uniq(data.map(d => generalizeMission(d.mission_or_experiment))));
        
        const matrix: { [key: string]: { [key: string]: number } } = {};
        let max = 0;
    
        uniqueOrganisms.forEach(org => {
            matrix[org] = {};
            uniqueMissions.forEach(mis => {
                matrix[org][mis] = 0;
            });
        });
    
        data.forEach(item => {
            const org = item.organism;
            const mis = generalizeMission(item.mission_or_experiment);
            if (matrix[org] && matrix[org][mis] !== undefined) {
                matrix[org][mis]++;
                if (matrix[org][mis] > max) max = matrix[org][mis];
            }
        });
    
        return { heatmapData: matrix, organisms: uniqueOrganisms, missions: uniqueMissions, maxCount: max };
    }, [data]);

    const colorScale = scaleLinear<string>().domain([0, maxCount]).range(["#e0f2fe", "#083361"]);
    const darkColorScale = scaleLinear<string>().domain([0, maxCount]).range(["#1e3a8a", "#f97316"]);

    // 4. Word Cloud Logic
    useEffect(() => {
        if (!data.length || !wordCloudRef.current) return;

        const text = data.map(d => `${d.title} ${d.main_findings}`).join(' ');
        const stopWords = new Set(["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "did", "do", "does", "doing", "don", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "s", "same", "she", "should", "so", "some", "such", "t", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "you", "your", "yours", "yourself", "yourselves", "cell", "cells", "effect", "effects", "study", "studies", "found", "showed", "analysis", "data", "results", "using", "response", "changes"]);
        
        const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
        const wordCounts = _.countBy(words);
        // FIX: Cast `value` to number for use in `Math.sqrt` as `Object.entries` can produce `unknown`.
        const layoutData = Object.entries(wordCounts).map(([text, value]) => ({ text, size: 10 + Math.sqrt(value as number) * 6 })).sort((a, b) => b.size - a.size).slice(0, 75);

        const svg = select(wordCloudRef.current);
        svg.selectAll('*').remove();
        const container = svg.node()?.parentElement;
        if (!container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;

        svg.attr('viewBox', [0, 0, width, height]).append('title').text('Word cloud of common research themes.');

        const layout = cloud().size([width, height]).words(layoutData).padding(5)
            .rotate(() => (Math.random() > 0.5 ? 0 : 90)).font('Roboto').fontSize(d => d.size!).on('end', draw);
        layout.start();

        function draw(words: cloud.Word[]) {
            const color = scaleOrdinal(schemeSet2);
            svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`).selectAll('text').data(words)
                .enter().append('text').style('font-size', d => `${d.size}px`).style('font-family', 'Roboto')
                .style('fill', (d, i) => color(i.toString())).attr('text-anchor', 'middle')
                .attr('transform', d => `translate(${d.x}, ${d.y})rotate(${d.rotate})`).text(d => d.text!)
                .style('opacity', 0).transition().duration(500).style('opacity', 1);
        }
    }, [data, theme]);

    if (!data || data.length === 0) {
        return <div className="text-center py-12 text-gray-500 dark:text-space-text-dim">No data to visualize.</div>;
    }

    return (
        <div>
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<FileTextIcon className="w-6 h-6" />} label="Total Reports" value={stats.totalReports} />
                <StatCard icon={<CalendarIcon className="w-6 h-6" />} label="Time Span" value={stats.yearRange} />
                <StatCard icon={<FlaskConicalIcon className="w-6 h-6" />} label="Top Organism" value={stats.topOrganism} />
                <StatCard icon={<RocketIcon className="w-6 h-6" />} label="Top Mission" value={stats.topMission} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer 
                    title="Mission & Platform Distribution"
                    description="Shows the proportion of research conducted on different space missions and platforms."
                    icon={<PieChartIcon className="w-6 h-6" />}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={missionDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {missionDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: themeColors.tooltipBg, border: `1px solid ${themeColors.tooltipBorder}` }}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer
                    title="Organism Research Trends"
                    description="Tracks the number of studies for each organism type over the years, revealing shifts in research focus."
                    icon={<TrendingUpIcon className="w-6 h-6" />}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={organismTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} />
                            <XAxis dataKey="year" stroke={themeColors.axis} />
                            <YAxis allowDecimals={false} stroke={themeColors.axis} />
                            <Tooltip contentStyle={{ backgroundColor: themeColors.tooltipBg, border: `1px solid ${themeColors.tooltipBorder}` }} />
                            <Legend />
                            {trendOrganisms.map((org, index) => (
                                <Area key={org} type="monotone" dataKey={org} stackId="1" stroke={PIE_COLORS[index % PIE_COLORS.length]} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer
                    title="Common Research Themes"
                    description="Visualizes the most frequent terms found in research titles and findings, highlighting key topics."
                    icon={<TextIcon className="w-6 h-6" />}
                >
                    <svg ref={wordCloudRef} className="w-full h-full"></svg>
                </ChartContainer>

                <ChartContainer
                    title="Organism vs. Mission Heatmap"
                    description="Reveals concentrations of research, showing which organisms were studied on specific missions."
                    icon={<GridIcon className="w-6 h-6" />}
                >
                    <div className="w-full h-full overflow-auto text-xs relative">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-white dark:bg-space-dark z-10">
                                <tr>
                                    <th className="sticky left-0 bg-white dark:bg-space-dark p-2 border-b border-r border-gray-300 dark:border-space-blue/50 w-24">Organism</th>
                                    {missions.map(mis => (
                                        <th key={mis} className="p-2 border-b border-gray-300 dark:border-space-blue/50 min-w-[80px] font-semibold">
                                            {mis}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {organisms.map(org => (
                                    <tr key={org}>
                                        <td className="sticky left-0 bg-white dark:bg-space-dark font-bold p-2 border-r border-b border-gray-300 dark:border-space-blue/50 w-24">{org}</td>
                                        {missions.map(mis => {
                                            const count = heatmapData[org]?.[mis] || 0;
                                            const bgColor = count > 0 ? (theme === 'dark' ? darkColorScale(count) : colorScale(count)) : 'transparent';
                                            return (
                                                <td key={`${org}-${mis}`} 
                                                    className="text-center border-r border-b border-gray-200 dark:border-space-blue/30 h-10"
                                                    style={{ backgroundColor: bgColor }}
                                                    aria-label={`${count} reports for ${org} in ${mis} missions`}
                                                >
                                                    {count > 0 && (
                                                        <span 
                                                          className="font-bold"
                                                          style={{ color: getContrastingTextColor(bgColor) }}
                                                        >
                                                            {count}
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ChartContainer>
            </div>
        </div>
    );
};

export default DataDashboard;