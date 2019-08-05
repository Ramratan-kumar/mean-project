import {NgModule} from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms' 
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login.component';
import { LoginRoutingModule } from './login.routing';
import { RegistrationComponent } from './registration.component';

@NgModule({
    imports:[
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        LoginRoutingModule
    ],
    declarations:[
        LoginComponent,
        RegistrationComponent
    ],

})

export class LoginModule {}