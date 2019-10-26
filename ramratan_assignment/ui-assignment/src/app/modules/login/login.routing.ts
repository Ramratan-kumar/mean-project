import { NgModule } from '@angular/core';
import { RouterModule,Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { RegistrationComponent } from './registration.component';

const router : Routes = []

@NgModule({
    imports:[ RouterModule.forRoot(router)],
    exports:[RouterModule]
})

export class LoginRoutingModule {}