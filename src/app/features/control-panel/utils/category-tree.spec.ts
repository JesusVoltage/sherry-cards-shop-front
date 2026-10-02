import { AdminCategory } from '../models/admin.model';
import { branchIds, categoryRows } from './category-tree';

function category(id: number, name: string, parentId: number | null, displayOrder: number, system = false): AdminCategory {
  return { id, name, slug: name.toLowerCase(), description: null, imageUrl: null, parentId, active: true,
    displayOrder, productCount: 0, childCount: 0, system };
}

describe('categoryRows', () => {
  const categories = [
    category(1, 'Pokémon', null, 1),
    category(9, 'Sin categoría', null, 0, true),
    category(2, 'One Piece', null, 0),
    category(3, 'Promos', 1, 1),
    category(4, 'Expansiones', 1, 0),
    category(5, 'Escarlata', 4, 0)
  ];

  it('flattens the tree in display order with depth and path, leaving Sin categoría last', () => {
    expect(categoryRows(categories).map((row) => [row.path, row.depth])).toEqual([
      ['One Piece', 1],
      ['Pokémon', 1],
      ['Pokémon › Expansiones', 2],
      ['Pokémon › Expansiones › Escarlata', 3],
      ['Pokémon › Promos', 2],
      ['Sin categoría', 1]
    ]);
  });

  it('knows each row siblings to move it within its level', () => {
    const promos = categoryRows(categories).find((row) => row.category.id === 3)!;
    expect(promos.siblingIds).toEqual([4, 3]);
    expect(promos.index).toBe(1);
  });

  it('collects a whole branch so it cannot become its own parent', () => {
    expect([...branchIds(categories, 1)].sort()).toEqual([1, 3, 4, 5]);
  });
});
