import { RouterModule,Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { DashboardComponent } from './dashboard.component';

const router : Routes = [
   { path:'',
     component: DashboardComponent
    }

] ;
@NgModule({
    imports:[RouterModule.forChild(router)]
})

export class DashboardRoutingModule {};