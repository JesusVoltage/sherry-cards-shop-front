export interface Novelty {
  id: number;
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  categoryName: string;
  categorySlug: string;
  displayOrder: number;
}
