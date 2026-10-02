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
  categories: { id: number; name: string; path: string; active: boolean; system: boolean }[];
  types: { code: string; name: string }[];
  statuses: { code: ProductStatusCode; name: string }[];
}

export interface UploadedImage {
  id: number;
  url: string;
  contentType: string;
  sizeBytes: number;
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  active: boolean;
  displayOrder: number;
  productCount: number;
  childCount: number;
  /** "Sin categoría": no se puede borrar, mover ni tener hijas. */
  system: boolean;
}

export interface CategoryRequest {
  name: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  active: boolean;
}

export type UserRoleCode = 'CLIENTE' | 'ADMIN' | string;
export type UserStatusCode = 'ACTIVO' | 'BLOQUEADO' | 'PENDIENTE' | string;

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  nombre: string;
  apellidos: string | null;
  role: UserRoleCode;
  status: UserStatusCode;
  emailVerifiedAt: string | null;
  lastAccessAt: string | null;
  createdAt: string;
  hasPassword: boolean;
  googleLinked: boolean;
}

export interface AdminUserRequest {
  username: string;
  email: string;
  nombre: string;
  apellidos: string | null;
  /** Obligatoria al crear; al editar, vacía conserva la actual. */
  password: string | null;
  role: UserRoleCode;
  status: UserStatusCode;
}

export interface UserFilters {
  search: string;
  role: string | null;
  status: string | null;
  page: number;
}

export interface UserOptions {
  roles: { code: UserRoleCode; name: string }[];
  statuses: { code: UserStatusCode; name: string }[];
}
