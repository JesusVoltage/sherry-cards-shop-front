import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowUp, LucideSparkles } from '@lucide/angular';
import { LEGAL_INFO } from '../../../core/config/legal.config';
import { BrandLogoComponent } from '../../../ui/components/brand-logo/brand-logo.component';

@Component({
  selector: 'scw-footer',
  standalone: true,
  imports: [RouterLink, BrandLogoComponent, LucideArrowUp, LucideSparkles],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly document = inject(DOCUMENT);
  protected readonly year = new Date().getFullYear();
  protected readonly contactEmail = LEGAL_INFO.email;

  protected scrollToTop(): void {
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
