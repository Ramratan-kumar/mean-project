import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGaurd } from './service/gaurd/auth-gaurd'

const routes: Routes = [{
  path: '',
  redirectTo: '/login',
  pathMatch: 'full'
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
