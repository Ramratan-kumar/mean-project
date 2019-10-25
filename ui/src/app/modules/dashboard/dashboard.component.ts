import { Component } from '@angular/core';
import { HttpService } from '../../service/https_service/httpService';
import { URL } from '../../shared/url';
import { ToastrService } from 'ngx-toastr';
import { CookieService } from 'ngx-cookie-service';

@Component({
    selector: "app-dashbord",
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent {

    userDetails: any;
    positionPoint: any;
    constructor(private httpService: HttpService, private toastr: ToastrService, private cookieService: CookieService) { }
    ngOnInit() {
        this.getUserDetails();
        this.showPosition();

    }


    getNearbyAuto() {
        this.httpService.getData(URL.nearByAuto+'/'+this.positionPoint.latitude+'/'+this.positionPoint.longitude).subscribe((res) => {
            console.log(res);
        }, (err) => {
            this.toastr.error(err);
        });
    }
    getUserDetails() {
        this.httpService.getData(URL.userDetials).subscribe((res) => {
            this.userDetails = res.body;
            if (this.userDetails.userType === 'driver') {
                this.getNearbyAuto();
            }
        }, (err) => {
            this.toastr.error(err);
        });
    }

    bookAuto() {
        this.httpService.update(URL.bookAuto, this.positionPoint).subscribe((res) => {
            if (res.status === 200) {

            } else {
                this.toastr.error(res.body.message);
            }

        }, (err) => {
            this.toastr.error(err);
        });
    }

    accept() {

    }

    reject() {

    }

    showPosition() {
        navigator.geolocation.getCurrentPosition((position) => {
            this.positionPoint = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }

        });

    }
}