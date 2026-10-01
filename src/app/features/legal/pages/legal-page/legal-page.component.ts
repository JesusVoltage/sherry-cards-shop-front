import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { map } from 'rxjs';
import { LEGAL_INFO } from '../../../../core/config/legal.config';

export type LegalPage = 'aviso-legal' | 'privacidad' | 'cookies' | 'condiciones';

@Component({
  selector: 'scw-legal-page',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.scss'
})
export class LegalPageComponent {
  protected readonly info = LEGAL_INFO;
  protected readonly page = toSignal(
    inject(ActivatedRoute).data.pipe(map((data) => data['page'] as LegalPage)),
    { initialValue: 'aviso-legal' as LegalPage }
  );
  protected readonly links: { path: string; label: string }[] = [
    { path: '/aviso-legal', label: 'Aviso legal' },
    { path: '/privacidad', label: 'Privacidad' },
    { path: '/cookies', label: 'Cookies' },
    { path: '/condiciones', label: 'Condiciones de venta' }
  ];
}
