// Loose name comparison for blacklist warnings: ignores case, accents, punctuation
// and company suffixes, so "ΜΑΥΡΙΔΗΣ Θ." matches "Μαυρίδης Θεόδωρος Ο.Ε.".

const SUFFIXES = new Set(['αε', 'οε', 'εε', 'επε', 'ικε', 'μεπε', 'αφοι', 'σια', 'και']);

function tokens(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ς/g, 'σ')
    .replace(/[^a-z0-9α-ω\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !SUFFIXES.has(t));
}

// The blacklist entry matching `name`, if any. A match needs a shared word of 4+ letters.
export function blacklistMatch(name, blacklist) {
  const mine = tokens(name);
  if (!mine.length) return null;
  return blacklist.find(entry => {
    const theirs = tokens(entry.name);
    return theirs.some(t => t.length >= 4 && mine.some(m => m === t || (m.length >= 4 && (m.startsWith(t) || t.startsWith(m)))));
  }) || null;
}
