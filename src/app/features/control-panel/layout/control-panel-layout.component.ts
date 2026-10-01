import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideFolderTree, LucideLayoutDashboard, LucideLogOut, LucidePackage, LucideStore, LucideUsers } from '@lucide/angular';
import { AuthService } from '../../auth/services/auth.service';
import { BrandLogoComponent } from '../../../ui/components/brand-logo/brand-logo.component';

/** Marco del panel de control: navegación lateral y contenido. Solo lo carga un administrador. */
@Component({
  selector: 'scw-control-panel-layout',
  imports: [
    RouterLink, RouterLinkActive, RouterOutlet, BrandLogoComponent,
    LucideFolderTree, LucideLayoutDashboard, LucideLogOut, LucidePackage, LucideStore, LucideUsers
  ],
  templateUrl: './control-panel-layout.component.html',
  styleUrl: './control-panel-layout.component.scss'
})
export class ControlPanelLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly user = this.auth.user;
  protected readonly loggingOut = signal(false);

  protected logout(): void {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/admin']),
      error: () => this.loggingOut.set(false)
    });
  }
}
