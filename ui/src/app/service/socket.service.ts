import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs'

@Injectable({
    providedIn:'root'
})

export class SocketService {
    constructor(private socket: Socket){}
    userId = "1239duf93mifi49";
    sendMessage(msg){
        this.socket.emit('new_msg',{"message":msg});
    }
    getMessage=()=>{
        return Observable.create((observer)=>{
            this.socket.on('new_msg',(msg)=>{
                observer.next(msg);
            });
        });
       
    }
}