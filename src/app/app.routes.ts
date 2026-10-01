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
				path: 'cuenta',
				title: 'Mi cuenta · Sherry Card Shop',
				canActivate: [AuthGuard],
				loadComponent: () => import('./features/auth/pages/account-page/account-page.component').then(
					(module) => module.AccountPageComponent
				)
			}
		]
	},
	{ path: '**', redirectTo: '' }
];
