export const getEpisodeId = (ep) => ep?.id ?? ep?.Id;

export const getEpisodeCategories = (ep) => {
  if (Array.isArray(ep?.categories)) return ep.categories;
  if (Array.isArray(ep?.Categories)) return ep.Categories;
  return [];
};

export const formatDuration = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return null;

  const totalSeconds = Math.floor(seconds);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;

  return `${m}m ${String(s).padStart(2, "0")}s`;
};