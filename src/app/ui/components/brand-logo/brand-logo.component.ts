import { Component } from '@angular/core';

let nextId = 0;

/**
 * Logotipo provisional: copa de jerez delante de dos cartas. Usa currentColor, así que toma el
 * color del texto que lo rodea. Las cartas se recortan con una máscara para que el hueco
 * alrededor de la copa funcione sobre cualquier fondo.
 */
@Component({
  selector: 'scw-brand-logo',
  template: `
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <defs>
        <mask [attr.id]="maskId" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#fff" stroke="none" />
          <g fill="#000" stroke="#000" stroke-width="14">
            <path [attr.d]="glass" />
            <path d="M50 61 V88" />
          </g>
        </mask>
      </defs>
      <g [attr.mask]="'url(#' + maskId + ')'">
        <rect x="-14" y="-23" width="28" height="46" rx="4" transform="translate(27 51) rotate(-16)" />
        <rect x="-14" y="-23" width="28" height="46" rx="4" transform="translate(73 51) rotate(16)" />
      </g>
      <path [attr.d]="glass" />
      <path d="M50 61 V87" />
      <path d="M38 89 H62" />
    </svg>
  `,
  styles: `
    :host { display: inline-block; width: 2rem; aspect-ratio: 1; line-height: 0; }
    svg { width: 100%; height: 100%; }
  `
})
export class BrandLogoComponent {
  protected readonly maskId = `brand-logo-mask-${nextId++}`;
  protected readonly glass = 'M39 9 C37.5 22 32 35 32 45 C32 54 39.5 60.5 50 60.5 C60.5 60.5 68 54 68 45 C68 35 62.5 22 61 9 Z';
}
