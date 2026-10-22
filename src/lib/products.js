// Product names are free text. Variants like "EUR 1200X800" / "EUR1200X800" / "EUR 1200 X 800"
// should be treated as the same product for price lookup and history.

export function cleanProduct(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9Ͱ-Ͽ \-./×+,]/g, '')
    .replace(/\s+/g, ' ');
}

export function productKey(name) {
  return (name || '')
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[\s.\-_,/]/g, '')
    .replace(/×/g, 'X');
}

// Distinct product names, most used first, one entry per key.
export function productCatalog(orders) {
  const byKey = new Map();
  for (const o of orders) {
    if (!o.product) continue;
    const k = productKey(o.product);
    if (!byKey.has(k)) byKey.set(k, { key: k, names: new Map(), count: 0 });
    const g = byKey.get(k);
    g.count++;
    g.names.set(o.product, (g.names.get(o.product) || 0) + 1);
  }
  return [...byKey.values()]
    .map(g => {
      const names = [...g.names.entries()].sort((a, b) => b[1] - a[1]);
      return { key: g.key, name: names[0][0], variants: names.map(n => n[0]), count: g.count };
    })
    .sort((a, b) => b.count - a.count);
}

export function duplicateGroups(orders) {
  return productCatalog(orders).filter(g => g.variants.length > 1);
}
