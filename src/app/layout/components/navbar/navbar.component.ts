import { Component, signal } from '@angular/core';
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
  imports: [LucideMenu, LucideSearch, LucideShoppingBag, LucideUserRound, LucideX],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
