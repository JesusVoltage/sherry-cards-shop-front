import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';
import {
  LucideMenu,
  LucideSearch,
  LucideShoppingBag,
  LucideUserRound,
  LucideX,
} from '@lucide/angular';

@Component({
  selector: 'scw-navbar',
  standalone: true,
  imports: [RouterLink, LucideMenu, LucideSearch, LucideShoppingBag, LucideUserRound, LucideX],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
