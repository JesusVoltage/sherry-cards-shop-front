import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SITE_CLOSED } from '../../../core/config/api.config';
import { FooterComponent } from '../footer/footer.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'scw-main-layout',
  standalone: true,
  imports: [FooterComponent, NavbarComponent, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  protected readonly siteClosed = inject(SITE_CLOSED);
}
