import { NgModule } from '@angular/core';
import { FooterComponent } from './footer/footer.component';

import { MatToolbarModule } from '@angular/material/toolbar';
import {MatSidenavModule} from '@angular/material/sidenav';
import { NavbarComponent } from './navbar/navbar.component';
import { ToastrService } from 'ngx-toastr';
import { RouterModule } from '@angular/router';
import { ToastrModule, ToastNoAnimationModule, ToastNoAnimation } from 'ngx-toastr';

@NgModule({
    imports: [
        MatToolbarModule,
        MatSidenavModule,
        RouterModule,
        ToastNoAnimationModule.forRoot()
    ],
    declarations: [
        FooterComponent,
        NavbarComponent
    ],
    providers: [ToastrService],
    exports: [
        FooterComponent,
        NavbarComponent,
        MatSidenavModule,
        RouterModule]

})
export class SharedModule { }