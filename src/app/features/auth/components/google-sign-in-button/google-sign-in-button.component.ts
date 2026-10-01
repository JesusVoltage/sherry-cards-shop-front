import {
  afterNextRender, Component, ElementRef, inject, input, NgZone, output, signal, viewChild
} from '@angular/core';
import { GOOGLE_CLIENT_ID } from '../../../../core/config/api.config';
import { GoogleIdentityService } from '../../services/google-identity.service';

const MAX_BUTTON_WIDTH = 400;

/**
 * Botón oficial "Iniciar sesión con Google". Emite el ID token (credential) que valida la API.
 * Solo se renderiza en el navegador.
 */
@Component({
  selector: 'scw-google-sign-in-button',
  template: `
    <div #button class="google-button" [hidden]="unavailable()"></div>
    @if (unavailable()) {
      <p class="google-unavailable" role="status">El acceso con Google no está disponible en este momento.</p>
    }
  `,
  styles: `
    :host { display: block; }
    .google-button { display: flex; min-height: 44px; justify-content: center; }
    .google-unavailable { margin: 0; color: #69758b; font-size: 0.75rem; text-align: center; }
  `
})
export class GoogleSignInButtonComponent {
  readonly text = input<'signin_with' | 'signup_with' | 'continue_with'>('continue_with');
  readonly credential = output<string>();
  protected readonly unavailable = signal(false);
  private readonly button = viewChild.required<ElementRef<HTMLElement>>('button');
  private readonly clientId = inject(GOOGLE_CLIENT_ID);
  private readonly googleIdentity = inject(GoogleIdentityService);
  private readonly zone = inject(NgZone);

  constructor() {
    afterNextRender(() => {
      if (!this.clientId) return;
      this.googleIdentity.load().then((google) => {
        google.initialize({
          client_id: this.clientId,
          // Google invoca el callback fuera de la zona de Angular.
          callback: ({ credential }) => this.zone.run(() => this.credential.emit(credential)),
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true
        });
        const element = this.button().nativeElement;
        google.renderButton(element, {
          type: 'standard', theme: 'outline', size: 'large', shape: 'rectangular',
          logo_alignment: 'left', text: this.text(), locale: 'es',
          width: Math.min(element.clientWidth || MAX_BUTTON_WIDTH, MAX_BUTTON_WIDTH)
        });
      }).catch(() => this.unavailable.set(true));
    });
  }
}
