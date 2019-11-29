import { NgModule } from '@angular/core';
import { RouterModule,Routes } from '@angular/router';
import { ChatBoxComponent } from './chat-box.component';


const router : Routes = []

@NgModule({
    imports:[ RouterModule.forRoot(router)],
    exports:[RouterModule]
})

export class ChatBoxRoutingModule {}