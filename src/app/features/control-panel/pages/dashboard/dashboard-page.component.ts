import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideFolderTree, LucideImagePlus, LucidePackage, LucidePlus, LucideUsers } from '@lucide/angular';
import { AuthService } from '../../../auth/services/auth.service';
import { Dashboard } from '../../models/admin.model';
import { AdminApiService } from '../../services/admin-api.service';
import { adminErrorMessage } from '../../utils/admin-errors';
import { formatBytes } from '../../utils/admin-format';

@Component({
  selector: 'scw-dashboard-page',
  imports: [RouterLink, LucideFolderTree, LucideImagePlus, LucidePackage, LucidePlus, LucideUsers],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['../../styles/panel-page.scss', './dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly user = inject(AuthService).user;
  protected readonly dashboard = signal<Dashboard | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly bytes = formatBytes;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.api.dashboard().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (dashboard) => this.dashboard.set(dashboard),
      error: (error: unknown) => this.error.set(adminErrorMessage(error, 'No se pudo cargar el resumen.'))
    });
  }

  protected storagePercent(dashboard: Dashboard): number {
    const { usedBytes, limitBytes } = dashboard.storage;
    return limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0;
  }
}
