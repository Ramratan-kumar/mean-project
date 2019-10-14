import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGaurd } from './service/gaurd/auth-gaurd'
import { LoginComponent } from './modules/login/login.component';
import { RegistrationComponent } from './modules/login/registration.component';
const routes: Routes = [{
  path: '',
  redirectTo: '/login',
  pathMatch: 'full'
},

{
  path:'login',
  component: LoginComponent
},
{
  path:'register',
  component:RegistrationComponent
},
{
  path: 'dashboard',
  canActivate: [AuthGaurd],
  loadChildren: ()=> import(`./modules/dashboard/dashboard.module`).then(m=>m.DashboardModule)
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
