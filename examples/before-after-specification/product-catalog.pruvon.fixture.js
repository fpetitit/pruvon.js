import * as catalog from './product-catalog.js';

export function beforeSpecification() {
  catalog.openCatalog();
  catalog.seedProduct('Apple', 1);
  catalog.seedProduct('Bread', 3);
  catalog.seedProduct('Cheese', 5);
}

export function afterSpecification() {
  catalog.closeCatalog();
}

export function priceOf(args) {
  return catalog.priceOf(args[0]);
}
