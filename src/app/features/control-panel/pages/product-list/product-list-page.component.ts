import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideChevronLeft, LucideChevronRight, LucidePackage, LucidePlus, LucideSearch } from '@lucide/angular';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap, tap } from 'rxjs';
import { AdminProductSummary, CatalogOptions, Page, ProductFilters, ProductStatusCode } from '../../models/admin.model';
import { AdminApiService } from '../../services/admin-api.service';
import { adminErrorMessage } from '../../utils/admin-errors';
import { formatDate, formatEur, STATUS_LABELS } from '../../utils/admin-format';

@Component({
  selector: 'scw-product-list-page',
  imports: [RouterLink, LucideChevronLeft, LucideChevronRight, LucidePackage, LucidePlus, LucideSearch],
  templateUrl: './product-list-page.component.html',
  styleUrls: ['../../styles/panel-page.scss', './product-list-page.component.scss']
})
export class ProductListPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searches = new Subject<string>();
  private readonly requests = new Subject<ProductFilters>();
  protected readonly filters = signal<ProductFilters>({ search: '', categoryId: null, status: null, page: 0 });
  protected readonly result = signal<Page<AdminProductSummary> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly options = signal<CatalogOptions | null>(null);
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly eur = formatEur;
  protected readonly date = formatDate;

  ngOnInit(): void {
    this.api.catalogOptions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (options) => this.options.set(options),
      error: () => this.options.set(null)
    });
    this.searches.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => this.update({ search, page: 0 }));
    // switchMap descarta la respuesta de una búsqueda anterior que llegue tarde.
    this.requests.pipe(
      tap(() => { this.loading.set(true); this.error.set(null); }),
      switchMap((filters) => this.api.products(filters).pipe(
        catchError((error: unknown) => {
          this.error.set(adminErrorMessage(error, 'No se pudieron cargar los productos.'));
          return of(null);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((page) => {
      this.loading.set(false);
      if (page) this.result.set(page);
    });
    this.reload();
  }

  protected search(value: string): void {
    this.searches.next(value);
  }

  protected filterCategory(value: string): void {
    this.update({ categoryId: value ? Number(value) : null, page: 0 });
  }

  protected filterStatus(value: string): void {
    this.update({ status: (value || null) as ProductStatusCode | null, page: 0 });
  }

  protected goTo(page: number): void {
    this.update({ page });
  }

  protected reload(): void {
    this.requests.next(this.filters());
  }

  private update(change: Partial<ProductFilters>): void {
    this.filters.update((filters) => ({ ...filters, ...change }));
    this.reload();
  }
}
