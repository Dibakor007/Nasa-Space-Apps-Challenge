import React, { useEffect, useRef } from 'react';
// FIX: D3 functions and types are imported from their specific sub-modules
// (e.g., d3-selection, d3-force) to resolve module errors.
import { drag as d3drag, D3DragEvent } from 'd3-drag';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  Simulation,
  SimulationNodeDatum,
} from 'd3-force';
import { select, pointer } from 'd3-selection';
import { symbol, symbolSquare, symbolCircle, symbolDiamond, symbolWye } from 'd3-shape';
import { zoom as d3zoom } from 'd3-zoom';
import 'd3-transition';
import { KnowledgeGraphData, GraphNode, GraphLink } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface KnowledgeGraphProps {
  data: KnowledgeGraphData;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!svgRef.current || !data || !tooltipRef.current) return;

    // FIX: Use named import 'select' instead of 'd3.select'.
    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    // FIX: Use named import 'select' instead of 'd3.select'.
    const tooltip = select(tooltipRef.current);

    const container = svg.node()?.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    
    svg.attr('viewBox', [0, 0, width, height]);

    // Make copies of data to avoid mutating props
    const nodes = data.nodes.map(d => ({ ...d })) as GraphNode[];
    const links = data.links.map(d => ({ ...d })) as GraphLink[];

    // --- Type-safe helper functions to get node IDs ---
    const getSourceId = (linkSource: string | GraphNode): string => 
        typeof linkSource === 'string' ? linkSource : linkSource.id;
        
    const getTargetId = (linkTarget: string | GraphNode): string => 
        typeof linkTarget === 'string' ? linkTarget : linkTarget.id;

    // --- Adjacency list for highlighting ---
    const linkedByIndex: { [key: string]: boolean } = {};
    links.forEach(d => {
      const sourceId = getSourceId(d.source);
      const targetId = getTargetId(d.target);
      linkedByIndex[`${sourceId},${targetId}`] = true;
    });

    function areNodesConnected(a: GraphNode, b: GraphNode): boolean {
      return linkedByIndex[`${a.id},${b.id}`] || linkedByIndex[`${b.id},${a.id}`] || a.id === b.id;
    }

    // --- Simulation setup ---
    // FIX: Use named imports for d3 force simulation functions.
    const simulation = forceSimulation<GraphNode>(nodes)
      .force('link', forceLink<GraphNode, GraphLink>(links).id(d => (d as GraphNode).id).distance(150))
      .force('charge', forceManyBody().strength(-450))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide().radius(40));

    // --- Main SVG Group for Zooming ---
    const g = svg.append('g');

    // --- Links ---
    const link = g.append('g')
      .attr('stroke', theme === 'dark' ? '#3b82f6' : '#9ca3af')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1.5);

    // --- Link Labels ---
    const linkLabel = g.append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr('font-size', '9px')
      .attr('fill', theme === 'dark' ? '#8892b0' : '#6b7280')
      .attr('text-anchor', 'middle')
      .text(d => d.label);

    // --- Nodes ---
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g');

    const color = (type: string) => {
        switch(type.toLowerCase()) {
            case 'experiment': return '#f97316';
            case 'organism': return '#3b82f6';
            case 'result': return '#10b981';
            case 'condition': return '#a855f7';
            default: return theme === 'dark' ? '#8892b0' : '#9ca3af';
        }
    }
    
    const symbolGenerator = (type: string) => {
      const size = 250;
      // FIX: Use named imports for d3 symbol functions.
      switch(type.toLowerCase()) {
          case 'experiment': return symbol().type(symbolSquare).size(size);
          case 'organism': return symbol().type(symbolCircle).size(size);
          case 'result': return symbol().type(symbolDiamond).size(size);
          case 'condition': return symbol().type(symbolWye).size(size);
          default: return symbol().type(symbolCircle).size(size);
      }
    }

    node.append('path')
        .attr('d', d => symbolGenerator(d.type)())
        .attr('fill', d => color(d.type))
        .attr('stroke', theme === 'dark' ? '#0a192f' : '#ffffff')
        .attr('stroke-width', 2.5);

    // --- Node Labels ---
    const nodeLabel = node.append('text')
      .text(d => d.id)
      .attr('x', 18)
      .attr('y', 5)
      .attr('fill', theme === 'dark' ? '#ccd6f6' : '#1f2937')
      .attr('font-size', '11px')
      .style('pointer-events', 'none');

    // --- Drag Logic ---
    // FIX: Use imported Simulation and D3DragEvent types.
    const drag = (simulation: Simulation<GraphNode, undefined>) => {
      function dragstarted(event: D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event: D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event: D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      // FIX: Use aliased import 'd3drag' instead of 'd3.drag'.
      return d3drag<SVGGElement, GraphNode>()
        .on('start', dragstarted).on('drag', dragged).on('end', dragended);
    }
    node.call(drag(simulation));

    // --- Hover and Tooltip Logic ---
    node.on('mouseover', function(event, d) {
        // FIX: Use named import 'pointer' instead of 'd3.pointer'.
        const [x, y] = pointer(event, container);
        tooltip.style('opacity', 1)
               .html(`<strong>ID:</strong> ${d.id}<br/><strong>Type:</strong> ${d.type}`)
               .style('left', (x + 15) + 'px')
               .style('top', (y + 10) + 'px');
        
        node.transition().duration(100).style('opacity', o => areNodesConnected(d, o) ? 1 : 0.15);
        nodeLabel.transition().duration(100).style('opacity', o => areNodesConnected(d, o) ? 1 : 0.15);
        link.transition().duration(100).style('opacity', o => ((o.source as GraphNode).id === d.id || (o.target as GraphNode).id === d.id) ? 1 : 0.1);
        linkLabel.transition().duration(100).style('opacity', o => ((o.source as GraphNode).id === d.id || (o.target as GraphNode).id === d.id) ? 1 : 0.1);
    })
    .on('mouseout', function() {
        tooltip.style('opacity', 0);
        node.transition().duration(200).style('opacity', 1);
        nodeLabel.transition().duration(200).style('opacity', 1);
        link.transition().duration(200).style('opacity', 1);
        linkLabel.transition().duration(200).style('opacity', 1);
    });

    // --- Simulation Tick ---
    simulation.on('tick', () => {
      // FIX: Cast source and target to SimulationNodeDatum to access x/y properties.
      // After simulation starts, these are guaranteed to be node objects with positions.
      link
        .attr('x1', d => (d.source as SimulationNodeDatum).x!)
        .attr('y1', d => (d.source as SimulationNodeDatum).y!)
        .attr('x2', d => (d.target as SimulationNodeDatum).x!)
        .attr('y2', d => (d.target as SimulationNodeDatum).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);

      // FIX: Cast source and target to SimulationNodeDatum to access x/y properties.
      linkLabel
        .attr('x', d => ((d.source as SimulationNodeDatum).x! + (d.target as SimulationNodeDatum).x!) / 2)
        .attr('y', d => ((d.source as SimulationNodeDatum).y! + (d.target as SimulationNodeDatum).y!) / 2);
    });
    
    // --- Zoom Logic ---
    // FIX: Use aliased import 'd3zoom' instead of 'd3.zoom'.
    const zoom = d3zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 5])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    svg.call(zoom);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, theme]);

  return (
    <div className="w-full h-full relative">
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
        <div 
            ref={tooltipRef} 
            className="absolute bg-gray-900 text-white text-xs rounded py-1 px-2 pointer-events-none opacity-0 transition-opacity duration-200 shadow-lg"
            style={{ zIndex: 100 }}
        ></div>
    </div>
  );
};

export default KnowledgeGraph;