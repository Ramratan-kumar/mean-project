import {Component } from '@angular/core';
import { HttpService } from '../../service/https_service/httpService';
import { URL } from '../../shared/url';

@Component({
    selector:"app-dashbord",
    templateUrl:'./dashboard.component.html',
    styleUrls:['./dashboard.component.scss']
})

export class DashboardComponent {

    constructor(private httpService:HttpService){}
    ngOnInit(){
        this.getUserDetails();
    }

    getUserDetails(){
        this.httpService.getData(URL.userDetials).subscribe((res)=>{
            console.log(res);
        })
    }
}