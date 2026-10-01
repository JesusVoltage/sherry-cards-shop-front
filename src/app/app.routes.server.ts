import { RenderMode, ServerRoute } from '@angular/ssr';
import { environment } from '../environments/environment';

export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'registro', renderMode: RenderMode.Client },
  { path: 'cuenta', renderMode: RenderMode.Client },
  { path: 'cuenta/**', renderMode: RenderMode.Client },
  // Con la tienda cerrada lo que se ve depende de la sesión, que solo existe en el navegador.
  environment.siteClosed
    ? { path: '**', renderMode: RenderMode.Client }
    : { path: '**', renderMode: RenderMode.Prerender }
];
