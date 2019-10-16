import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { LoadingComponent } from './loading.component';
import { SharedModule } from '../shared/shared.module'

@NgModule({
  declarations: [
    LoadingComponent
  ],
  imports: [
    SharedModule
  ],
  providers: [],
  bootstrap: []
})
export class LoadingModule { }
