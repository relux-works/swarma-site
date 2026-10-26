export const locales = ['ru', 'en'] as const;
export type Locale = typeof locales[number];
export const localeLabels = { ru: 'Русский', en: 'English' };
export function route(id: string) {
  const [lang, ...parts] = id.split('/');
  const slug = parts.join('/');
  return `/${lang}/${slug === 'index' ? '' : `${slug}/`}`;
}
