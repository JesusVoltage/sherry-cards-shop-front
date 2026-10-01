export type ProductStatusCode = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface Dashboard {
  products: { total: number; active: number; draft: number; archived: number };
  categories: number;
  users: number;
  admins: number;
  storage: { enabled: boolean; usedBytes: number; limitBytes: number };
}

export interface AdminProductSummary {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  categoryName: string;
  type: string;
  status: ProductStatusCode;
  variantCount: number;
  minPrice: number | null;
  totalStock: number;
  imageUrl: string | null;
  updatedAt: string;
}

export interface AdminVariant {
  id: number | null;
  sku: string | null;
  name: string;
  price: number;
  compareAtPrice: number | null;
  vatRate: number;
  stockQuantity: number;
  weightGrams: number | null;
  active: boolean;
}

export interface AdminImage {
  url: string;
  altText: string | null;
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  type: string;
  status: ProductStatusCode;
  description: string | null;
  releaseDate: string | null;
  variants: AdminVariant[];
  images: AdminImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  name: string;
  slug: string | null;
  categoryId: number;
  type: string;
  status: ProductStatusCode;
  description: string | null;
  releaseDate: string | null;
  variants: AdminVariant[];
  images: AdminImage[];
}

export interface ProductFilters {
  search: string;
  categoryId: number | null;
  status: ProductStatusCode | null;
  page: number;
}

export interface CatalogOptions {
  categories: { id: number; name: string; path: string; active: boolean }[];
  types: { code: string; name: string }[];
  statuses: { code: ProductStatusCode; name: string }[];
}

export interface UploadedImage {
  id: number;
  url: string;
  contentType: string;
  sizeBytes: number;
}
