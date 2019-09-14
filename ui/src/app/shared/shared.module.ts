import { NgModule } from '@angular/core';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import {MatToolbarModule} from '@angular/material/toolbar';
import { ToastrService } from 'ngx-toastr';
import { ToastrModule,ToastNoAnimationModule,ToastNoAnimation } from 'ngx-toastr';

@NgModule({
    imports: [
        MatToolbarModule,
        ToastNoAnimationModule.forRoot()
    ],
    declarations: [
        FooterComponent,
        HeaderComponent
    ],
    providers: [ToastrService]

})
export class SharedModule { }