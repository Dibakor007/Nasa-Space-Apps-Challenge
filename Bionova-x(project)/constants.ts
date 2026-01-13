/**
 * Legacy placeholder. All topic and filter data now lives on the backend
 * and is exposed through the /api/metadata endpoint.
 */

export {};

export const ORGANISM_TYPES = [
  "Human",
  "Mice",
  "Rats",
  "Zebrafish",
  "Fruit flies",
  "Plants",
  "Microbes",
  "Fungi",
  "C. elegans",
  "Yeast",
  "Algae",
  "Other",
];

export const MISSION_PLATFORMS = [
  "ISS",
  "Shuttle",
  "GeneLab",
  "VEGGIE",
  "Rodent Research",
  "Artemis",
  "Twins Study",
  "Other",
  "N/A",
];

export const RESEARCH_AREAS = categories.map(cat => cat.title);

export const PUBLICATION_TYPES = [
  "Dataset",
  "Publication/Paper",
  "Experiment",
  "Article",
  "Report",
  "Other",
];