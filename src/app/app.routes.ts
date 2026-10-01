import { Routes } from '@angular/router';
import { AuthGuard } from './features/auth/guards/auth.guard';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () =>
			import('./layout/components/main-layout/main-layout.component').then(
				(module) => module.MainLayoutComponent
			),
		children: [
			{
				path: '',
				loadComponent: () =>
					import('./features/home/pages/home-page/home-page.component').then(
						(module) => module.HomePageComponent
					)
			},
			{
				path: 'login',
				title: 'Iniciar sesión · Sherry Card Shop',
				loadComponent: () => import('./features/auth/pages/login-page/login-page.component').then(
					(module) => module.LoginPageComponent
				)
			},
			{
				path: 'registro',
				title: 'Crear cuenta · Sherry Card Shop',
				loadComponent: () => import('./features/auth/pages/register-page/register-page.component').then(
					(module) => module.RegisterPageComponent
				)
			},
			{
				path: 'aviso-legal',
				title: 'Aviso legal · Sherry Card Shop',
				data: { page: 'aviso-legal' },
				loadComponent: () => import('./features/legal/pages/legal-page/legal-page.component').then(
					(module) => module.LegalPageComponent
				)
			},
			{
				path: 'privacidad',
				title: 'Política de privacidad · Sherry Card Shop',
				data: { page: 'privacidad' },
				loadComponent: () => import('./features/legal/pages/legal-page/legal-page.component').then(
					(module) => module.LegalPageComponent
				)
			},
			{
				path: 'cookies',
				title: 'Política de cookies · Sherry Card Shop',
				data: { page: 'cookies' },
				loadComponent: () => import('./features/legal/pages/legal-page/legal-page.component').then(
					(module) => module.LegalPageComponent
				)
			},
			{
				path: 'condiciones',
				title: 'Condiciones de venta · Sherry Card Shop',
				data: { page: 'condiciones' },
				loadComponent: () => import('./features/legal/pages/legal-page/legal-page.component').then(
					(module) => module.LegalPageComponent
				)
			},
			{
				path: 'cuenta',
				canActivate: [AuthGuard],
				loadComponent: () => import('./features/account/layout/account-layout.component').then(
					(module) => module.AccountLayoutComponent
				),
				children: [
					{
						path: '',
						title: 'Mi cuenta · Sherry Card Shop',
						loadComponent: () => import('./features/account/pages/account-dashboard/account-dashboard.component').then(
							(module) => module.AccountDashboardComponent
						)
					},
					{
						path: 'direcciones',
						title: 'Mis direcciones · Sherry Card Shop',
						loadComponent: () => import('./features/account/pages/account-addresses/account-addresses.component').then(
							(module) => module.AccountAddressesComponent
						)
					},
					{
						path: 'datos',
						title: 'Detalles de la cuenta · Sherry Card Shop',
						loadComponent: () => import('./features/account/pages/account-details/account-details.component').then(
							(module) => module.AccountDetailsComponent
						)
					}
				]
			}
		]
	},
	{ path: '**', redirectTo: '' }
];
