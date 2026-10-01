import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BrandLogoComponent } from '../../../ui/components/brand-logo/brand-logo.component';

/** Marco mínimo mientras la tienda está cerrada: marca, contenido y enlaces legales. */
@Component({
  selector: 'scw-closed-layout',
  imports: [BrandLogoComponent, RouterLink, RouterOutlet],
  templateUrl: './closed-layout.component.html',
  styleUrl: './closed-layout.component.scss'
})
export class ClosedLayoutComponent {
  protected readonly year = new Date().getFullYear();
}
