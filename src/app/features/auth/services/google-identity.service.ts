import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export interface GoogleCredentialResponse {
  credential: string;
}

export interface GoogleButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  shape?: 'rectangular' | 'pill';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
}

/** Subconjunto de la API de Google Identity Services que usa la aplicación. */
export interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: 'popup' | 'redirect';
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
  disableAutoSelect(): void;
}

type GoogleWindow = Window & { google?: { accounts?: { id?: GoogleAccountsId } } };

/** Carga una sola vez el script de Google Identity Services en el navegador. */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly document = inject(DOCUMENT);
  private loading?: Promise<GoogleAccountsId>;

  load(): Promise<GoogleAccountsId> {
    const view = this.document.defaultView as GoogleWindow | null;
    const loaded = view?.google?.accounts?.id;
    if (loaded) return Promise.resolve(loaded);

    this.loading ??= new Promise<GoogleAccountsId>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = GSI_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        const api = view?.google?.accounts?.id;
        if (api) resolve(api);
        else reject(new Error('Google Identity Services no está disponible.'));
      };
      script.onerror = () => {
        // Permite reintentar si el script lo bloqueó la red o un bloqueador de anuncios.
        this.loading = undefined;
        script.remove();
        reject(new Error('No se pudo cargar Google Identity Services.'));
      };
      this.document.head.appendChild(script);
    });
    return this.loading;
  }

  /** Evita que Google vuelva a seleccionar la cuenta automáticamente tras cerrar sesión. */
  disableAutoSelect(): void {
    (this.document.defaultView as GoogleWindow | null)?.google?.accounts?.id?.disableAutoSelect();
  }
}
