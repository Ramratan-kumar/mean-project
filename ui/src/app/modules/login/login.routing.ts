import { NgModule } from '@angular/core';
import { RouterModule,Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { RegistrationComponent } from './registration.component';

const router : Routes = [
    {
        path:'login',component:LoginComponent,
    
    },
    {
        path:'register',component:RegistrationComponent
    }
]

@NgModule({
    imports:[ RouterModule.forRoot(router)]
})

export class LoginRoutingModule {}