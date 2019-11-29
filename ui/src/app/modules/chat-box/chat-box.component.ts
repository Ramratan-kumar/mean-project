import { Component,AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { SocketService } from '../../service/socket.service';
@Component({
    selector:'chat-box',
    templateUrl:'./chat-box.component.html',
    styleUrls:['./chat-box.component.scss']
})

export class ChatBoxComponent {
    @ViewChild("chatmsg",{static:true}) chatmsg:ElementRef;
    @ViewChild("chat",{static:true}) chat:ElementRef;
    msg:any;
    messages:any='';
    
    constructor(private socketService: SocketService){

    }
    ngOnInit(){
        this.socketService.getMessage().subscribe((msg)=>{
            this.messages = msg.message;
            this.chatmsg.nativeElement.insertAdjacentHTML('beforeend', "<span class='msg-box'>"+this.messages+"</span><br><br>");
            //this.chat.nativeElement.className = "msg-box"
        });
    }
    send(){
        if(this.msg){
            this.socketService.sendMessage(this.msg);
        }
       
        this.msg = "";
    }
   

ngAfterViewInit() {
    console.log(this.chat);
    //this.chat.nativeElement.className = "msg-box"
    //this.chat.nativeElement.insertAdjacentHTML('beforeend', "<br><span class='msg-box'>"+this.messages+"</span>");
}
ngAfterContentInit(){
    console.log(this.chat);
}
}