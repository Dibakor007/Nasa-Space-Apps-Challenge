// FIX: D3 types are imported from their specific sub-modules (e.g., d3-force)
// instead of the monolithic 'd3' package to ensure proper type resolution.
import { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';

// OLD TYPE - Will be replaced by new detailed schema
// export interface AiSearchResult {
//   summary: string;
//   publications: string[];
// }


// --- NEW AI SEARCH RESULT SCHEMA ---

export interface AiSearchSummary {
    overview: string;
    years_range: string;
    highlight_points: string[];
}

export interface DetailedReportItem {
    title: string;
    year: number;
    organism: string;
    mission_or_experiment: string;
    main_findings: string;
    source_url: string | null;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface AiSearchResult {
    summary: AiSearchSummary;
    detailed_report: DetailedReportItem[];
    graph: KnowledgeGraphData;
}


// --- GRAPH TYPES (UPDATED) ---

// FIX: Extend from imported SimulationNodeDatum type directly.
export interface GraphNode extends SimulationNodeDatum {
  id: string;
  type: string;
}

// FIX: Extend from imported SimulationLinkDatum type directly.
export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  // FIX: D3 force simulation replaces string IDs with node objects after initialization.
  // The type must reflect that `source` and `target` can be either a string or a GraphNode.
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
}