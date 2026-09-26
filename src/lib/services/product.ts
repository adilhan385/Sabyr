/**
 * SABYR Luxury Fashion — Product Service
 *
 * Encapsulates catalog business logic:
 * - Live products retrieval (database-first, JSON fallback)
 * - Product creation with dual persistence (PostgreSQL + local store)
 * - Soft-deletion in PostgreSQL (isActive: false) + local store sync
 */

import { ProductItem } from "@/data/mockData";
import {
  getLiveCatalogProducts,
  addProductToDb,
  deleteProductFromDb,
} from "@/lib/productsStore";

export class ProductService {
  /**
   * Retrieves active catalog products.
   * Queries PostgreSQL via Prisma first, falls back to local products.json.
   */
  public static async getProducts(): Promise<ProductItem[]> {
    return getLiveCatalogProducts();
  }

  /**
   * Adds a product to the catalog.
   */
  public static addProduct(product: ProductItem): ProductItem {
    return addProductToDb(product);
  }

  /**
   * Deletes a product from the catalog.
   */
  public static deleteProduct(id: string): boolean {
    return deleteProductFromDb(id);
  }
}
