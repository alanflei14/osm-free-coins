import { getEnvConfig } from "@/lib/env";
import { requestJson } from "@/lib/http";
import { buildCommonHeaders } from "./osm-headers";

export interface OSMProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  discount?: number;
}

export interface OSMShopCatalog {
  products: OSMProduct[];
}

const SHOP_URL = "https://web-api.onlinesoccermanager.com/api/v1/shop/catalog";

// Cache para evitar llamadas repetidas
let shopCatalogCache: Map<number, OSMProduct> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 3600000; // 1 hora

export async function getProductPrice(
  accessToken: string,
  productId: number,
): Promise<number> {
  const env = getEnvConfig();
  const now = Date.now();

  // Usar cache si está disponible y válido
  if (shopCatalogCache && now - cacheTimestamp < CACHE_TTL) {
    const product = shopCatalogCache.get(productId);
    if (product) {
      return product.price;
    }
  }

  try {
    const catalog = await requestJson<OSMShopCatalog>({
      url: SHOP_URL,
      method: "GET",
      headers: buildCommonHeaders(env, env.osmPlatformIdVideo, `Bearer ${accessToken}`),
      timeoutMs: env.requestTimeoutMs,
      retries: env.requestRetries,
    });

    // Actualizar cache
    shopCatalogCache = new Map();
    for (const product of catalog.products) {
      shopCatalogCache.set(product.id, product);
    }
    cacheTimestamp = now;

    const product = shopCatalogCache.get(productId);
    if (product) {
      return product.price;
    }

    // Si no encuentra el producto, retorna un valor por defecto
    return 0;
  } catch (error) {
    console.error(`Error fetching product price for ${productId}:`, error);
    // Retornar un valor por defecto si hay error
    return 0;
  }
}

/**
 * Obtiene el precio del boost de entrenamiento (productId 514)
 */
export async function getTrainingBoostPrice(accessToken: string): Promise<number> {
  return getProductPrice(accessToken, 514);
}
