import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Category } from '../../models/category.model';
import { Novelty } from '../../models/novelty.model';
import { CategoriesApiService } from '../../services/categories-api.service';
import { NoveltiesApiService } from '../../services/novelties-api.service';

@Component({
	selector: 'scw-home-page',
	standalone: true,
	templateUrl: './home-page.component.html',
	styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
	private readonly categoriesApi = inject(CategoriesApiService);
	private readonly noveltiesApi = inject(NoveltiesApiService);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly categories = signal<Category[]>([]);
	protected readonly loading = signal(true);
	protected readonly loadError = signal(false);
	protected readonly novelties = signal<Novelty[]>([]);
	protected readonly noveltiesLoading = signal(true);
	protected readonly noveltiesLoadError = signal(false);

	constructor() {
		this.loadCategories();
		this.loadNovelties();
	}

	protected loadNovelties(): void {
		this.noveltiesLoading.set(true);
		this.noveltiesLoadError.set(false);

		this.noveltiesApi.getNovelties().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: (novelties) => {
				this.novelties.set(novelties);
				this.noveltiesLoading.set(false);
			},
			error: () => {
				this.noveltiesLoadError.set(true);
				this.noveltiesLoading.set(false);
			}
		});
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
