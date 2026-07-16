const DIACRITICS_REGEX = /[̀-ͯ]/g;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function slugWithSuffix(base: string, suffix: string): string {
  const slug = slugify(base);
  return `${slug}-${suffix}`.slice(0, 80);
}
