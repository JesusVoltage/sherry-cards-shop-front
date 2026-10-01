import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ADMIN_ROLE } from '../../../features/auth/models/user.model';
import { AuthService } from '../../../features/auth/services/auth.service';
import { BrandLogoComponent } from '../../../ui/components/brand-logo/brand-logo.component';
import {
  LucideLayoutDashboard,
  LucideMenu,
  LucideSearch,
  LucideShoppingBag,
  LucideUserRound,
  LucideX,
} from '@lucide/angular';

@Component({
  selector: 'scw-navbar',
  standalone: true,
  imports: [RouterLink, BrandLogoComponent, LucideLayoutDashboard, LucideMenu, LucideSearch, LucideShoppingBag, LucideUserRound, LucideX],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly adminRole = ADMIN_ROLE;
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
