import { useEffect, useState } from 'react';
import { productApi } from '../api/productApi';
import type { Product } from '../types';

/**
 * Frontend-only product lookup cache built from the existing public
 * GET /api/products endpoint. Lets checkout/order/cart UIs resolve a
 * productId to its current image/name/seller without any backend change.
 */
let cache: Record<number, Product> | null = null;
let inFlight: Promise<Record<number, Product>> | null = null;

async function loadAllProducts(): Promise<Record<number, Product>> {
  if (cache) return cache;
  if (!inFlight) {
    inFlight = productApi
      .getProducts()
      .then((products) => {
        const map: Record<number, Product> = {};
        products.forEach((p) => {
          map[p.id] = p;
        });
        cache = map;
        return map;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function useProductLookup(): { products: Record<number, Product>; isLoading: boolean } {
  const [map, setMap] = useState<Record<number, Product>>(cache ?? {});
  const [isLoading, setIsLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setMap(cache);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    loadAllProducts().then((m) => {
      if (!cancelled) {
        setMap(m);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { products: map, isLoading };
}
