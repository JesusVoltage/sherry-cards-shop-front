import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideLayoutDashboard, LucideLogOut, LucideMapPin, LucidePackage, LucideUserRound } from '@lucide/angular';
import { AccountSessionService } from '../services/account-session.service';

@Component({
  selector: 'scw-account-layout',
  imports: [
    RouterLink, RouterLinkActive, RouterOutlet,
    LucideLayoutDashboard, LucideLogOut, LucideMapPin, LucidePackage, LucideUserRound
  ],
  providers: [AccountSessionService],
  templateUrl: './account-layout.component.html',
  styleUrl: './account-layout.component.scss'
})
export class AccountLayoutComponent {
  protected readonly session = inject(AccountSessionService);
}
