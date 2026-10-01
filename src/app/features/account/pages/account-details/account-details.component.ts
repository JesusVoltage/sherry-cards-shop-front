import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AccountSessionService } from '../../services/account-session.service';

@Component({
  selector: 'scw-account-details',
  imports: [DatePipe],
  templateUrl: './account-details.component.html',
  styleUrls: ['../../styles/account-page.scss', './account-details.component.scss']
})
export class AccountDetailsComponent {
  protected readonly user = inject(AccountSessionService).user;
}
