import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideLogOut, LucideMapPin, LucidePackage, LucideUserRound } from '@lucide/angular';
import { AccountSessionService } from '../../services/account-session.service';

@Component({
  selector: 'scw-account-dashboard',
  imports: [RouterLink, LucideLogOut, LucideMapPin, LucidePackage, LucideUserRound],
  templateUrl: './account-dashboard.component.html',
  styleUrls: ['../../styles/account-page.scss', './account-dashboard.component.scss']
})
export class AccountDashboardComponent {
  protected readonly session = inject(AccountSessionService);
}
