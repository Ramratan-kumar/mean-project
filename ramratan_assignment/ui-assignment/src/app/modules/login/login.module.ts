import {NgModule} from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms' 
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login.component';
import { LoginRoutingModule } from './login.routing';
import { RegistrationComponent } from './registration.component';
import { ServiceModule } from '../../service/service.module';

@NgModule({
    imports:[
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        LoginRoutingModule,
        ServiceModule
    ],
    declarations:[
        LoginComponent,
        RegistrationComponent
    ],
    //providers:[HttpService]

})

export class LoginModule {}