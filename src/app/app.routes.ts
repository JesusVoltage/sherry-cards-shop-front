import { Routes } from '@angular/router';
import { AdminGuard } from './features/auth/guards/admin.guard';
import { AuthGuard } from './features/auth/guards/auth.guard';
import { SiteAccessGuard } from './features/auth/guards/site-access.guard';

const legalRoutes: Routes = [
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
	}
];

export const routes: Routes = [
	{
		path: 'admin',
		title: 'Administración · Sherry Card Shop',
		loadComponent: () => import('./features/auth/pages/admin-login-page/admin-login-page.component').then(
			(module) => module.AdminLoginPageComponent
		)
	},
	{
		// Sección secreta: sin rol ADMIN la ruta no existe y cae en el comodín final.
		path: 'controlpanel',
		canMatch: [AdminGuard],
		loadComponent: () => import('./features/control-panel/layout/control-panel-layout.component').then(
			(module) => module.ControlPanelLayoutComponent
		),
		children: [
			{
				path: '',
				title: 'Panel de control · Sherry Card Shop',
				loadComponent: () => import('./features/control-panel/pages/dashboard/dashboard-page.component').then(
					(module) => module.DashboardPageComponent
				)
			},
			{
				path: 'productos',
				title: 'Productos · Panel de control',
				loadComponent: () => import('./features/control-panel/pages/product-list/product-list-page.component').then(
					(module) => module.ProductListPageComponent
				)
			},
			{
				path: 'productos/nuevo',
				title: 'Nuevo producto · Panel de control',
				loadComponent: () => import('./features/control-panel/pages/product-form/product-form-page.component').then(
					(module) => module.ProductFormPageComponent
				)
			},
			{
				path: 'productos/:id',
				title: 'Editar producto · Panel de control',
				loadComponent: () => import('./features/control-panel/pages/product-form/product-form-page.component').then(
					(module) => module.ProductFormPageComponent
				)
			}
		]
	},
	{
		path: '',
		canMatch: [SiteAccessGuard],
		loadComponent: () =>
			import('./layout/components/main-layout/main-layout.component').then(
				(module) => module.MainLayoutComponent
			),
		children: [
			{
				path: '',
				title: 'Sherry Card Shop',
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
			...legalRoutes,
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
	{
		// Con la tienda cerrada, quien no es administrador solo ve "próximamente" y las páginas legales.
		path: '',
		loadComponent: () => import('./layout/components/closed-layout/closed-layout.component').then(
			(module) => module.ClosedLayoutComponent
		),
		children: [
			{
				path: '',
				title: 'Próximamente · Sherry Card Shop',
				loadComponent: () => import('./features/coming-soon/pages/coming-soon-page/coming-soon-page.component').then(
					(module) => module.ComingSoonPageComponent
				)
			},
			...legalRoutes
		]
	},
	{ path: '**', redirectTo: '' }
];
