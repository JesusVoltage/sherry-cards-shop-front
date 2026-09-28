import { Component, inject, signal } from '@angular/core';
import { Category } from '../../models/category.model';
import { CategoriesApiService } from '../../services/categories-api.service';

@Component({
	selector: 'scw-home-page',
	standalone: true,
	templateUrl: './home-page.component.html',
	styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
	private readonly categoriesApi = inject(CategoriesApiService);

	protected readonly categories = signal<Category[]>([]);
	protected readonly loading = signal(true);
	protected readonly loadError = signal(false);

	constructor() {
		this.loadCategories();
	}

	protected loadCategories(): void {
		this.loading.set(true);
		this.loadError.set(false);

		this.categoriesApi.getCategories().subscribe({
			next: (categories) => {
				this.categories.set(categories);
				this.loading.set(false);
			},
			error: () => {
				this.loadError.set(true);
				this.loading.set(false);
			}
		});
	}
}
