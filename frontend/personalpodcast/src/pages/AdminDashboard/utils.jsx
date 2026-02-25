
export const emptyCreateEpisode = {
  title: "",
  description: "",
  season: "",
  isPublished: true,
  file: null,
};

export const emptyCreateUser = {
  username: "",
  firstName: "",
  lastName: "",
  age: "",
  email: "",
  role: "User",
  password: "",
};

export function formatDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleString();
}

export function secondsToMinSec(seconds) {
  const s = Number(seconds);
  if (!Number.isFinite(s) || s <= 0) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

export function getEpisodeCategoryLabels(e, categories) {
  const idToName = new Map((categories || []).map((c) => [c.id, c.name]));

  const pickName = (obj) =>
    obj?.name ??
    obj?.Name ??
    obj?.categoryName ??
    obj?.CategoryName ??
    obj?.title ??
    obj?.Title ??
    obj?.category?.name ??
    obj?.category?.Name ??
    obj?.category?.title ??
    obj?.Category?.name ??
    obj?.Category?.Name ??
    obj?.Category?.title ??
    null;

  const pickId = (obj) =>
    obj?.categoryId ??
    obj?.CategoryId ??
    obj?.categoryID ??
    obj?.CategoryID ??
    obj?.id ??
    obj?.Id ??
    obj?.category?.id ??
    obj?.category?.Id ??
    obj?.Category?.id ??
    obj?.Category?.Id ??
    null;

  if (Array.isArray(e?.categories) && e.categories.length) {
    if (typeof e.categories[0] === "string") return e.categories;
    if (typeof e.categories[0] === "number") {
      return e.categories.map((id) => idToName.get(id)).filter(Boolean);
    }
    const names = e.categories.map(pickName).filter(Boolean);
    if (names.length) return names;
  }

  const ecs = Array.isArray(e?.episodeCategories) ? e.episodeCategories : [];
  if (!ecs.length) return [];

  if (typeof ecs[0] === "string") return ecs.filter(Boolean);

  if (typeof ecs[0] === "number") {
    return ecs.map((id) => idToName.get(id)).filter(Boolean);
  }

  const names = ecs.map(pickName).filter(Boolean);
  if (names.length) return names;

  const ids = ecs.map(pickId).filter((v) => typeof v === "number");
  if (ids.length) return ids.map((id) => idToName.get(id)).filter(Boolean);

  return [];
}