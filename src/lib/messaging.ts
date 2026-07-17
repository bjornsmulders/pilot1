/**
 * Eenvoudige {{variabele}}-vervanging voor berichttemplates (module G). Geen
 * templating-library nodig voor dit beperkte gebruik. Onbekende variabelen
 * blijven letterlijk staan (zichtbaar signaal voor de organisator dat er iets
 * ontbreekt, in plaats van stilzwijgend een lege string).
 */
export function renderTemplate(body: string, variables: Record<string, string>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key: string) => {
    return key in variables ? variables[key] : match;
  });
}
