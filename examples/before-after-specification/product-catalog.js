let products = null;

export function openCatalog() {
  products = new Map();
}

export function seedProduct(name, price) {
  products.set(name, price);
}

export function priceOf(name) {
  if (!products) throw new Error('catalog is not open');
  return products.get(name);
}

export function closeCatalog() {
  products = null;
}
