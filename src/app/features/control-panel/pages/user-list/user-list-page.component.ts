import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideChevronLeft, LucideChevronRight, LucideSearch, LucideUserPlus, LucideUsers } from '@lucide/angular';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { AdminUser, Page, UserFilters, UserOptions } from '../../models/admin.model';
import { AdminApiService } from '../../services/admin-api.service';
import { adminErrorMessage } from '../../utils/admin-errors';
import { formatDate, ROLE_LABELS, USER_STATUS_LABELS } from '../../utils/admin-format';

@Component({
  selector: 'scw-user-list-page',
  imports: [RouterLink, LucideChevronLeft, LucideChevronRight, LucideSearch, LucideUserPlus, LucideUsers],
  templateUrl: './user-list-page.component.html',
  styleUrls: ['../../styles/panel-page.scss', '../../styles/panel-table.scss', './user-list-page.component.scss']
})
export class UserListPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searches = new Subject<string>();
  private readonly requests = new Subject<UserFilters>();
  protected readonly me = inject(AuthService).user;
  protected readonly filters = signal<UserFilters>({ search: '', role: null, status: null, page: 0 });
  protected readonly result = signal<Page<AdminUser> | null>(null);
  protected readonly options = signal<UserOptions | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly statusLabels = USER_STATUS_LABELS;
  protected readonly date = formatDate;

  ngOnInit(): void {
    this.api.userOptions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (options) => this.options.set(options),
      error: () => this.options.set(null)
    });
    this.searches.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => this.update({ search, page: 0 }));
    this.requests.pipe(
      tap(() => { this.loading.set(true); this.error.set(null); }),
      switchMap((filters) => this.api.users(filters).pipe(catchError((error: unknown) => {
        this.error.set(adminErrorMessage(error, 'No se pudieron cargar los usuarios.'));
        return of(null);
      }))),
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

  protected filterRole(value: string): void {
    this.update({ role: value || null, page: 0 });
  }

  protected filterStatus(value: string): void {
    this.update({ status: value || null, page: 0 });
  }

  protected goTo(page: number): void {
    this.update({ page });
  }

  protected reload(): void {
    this.requests.next(this.filters());
  }

  private update(change: Partial<UserFilters>): void {
    this.filters.update((filters) => ({ ...filters, ...change }));
    this.reload();
  }
}
