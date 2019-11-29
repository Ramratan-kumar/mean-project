import {NgModule} from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms' 
import { CommonModule } from '@angular/common';
import { ChatBoxComponent } from './chat-box.component';
import { ChatBoxRoutingModule } from './chat-box.routing';

@NgModule({
    imports:[
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        ChatBoxRoutingModule
    ],
    declarations:[
        ChatBoxComponent
    ],
})

export class ChatBoxModule {}