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
    bookingDetails: any;
    dropLoacation: string;
    nearByAutoList:Array<any> = [];
    isBookingDetails:boolean = false;
    bookingStatus:any;
    constructor(private httpService: HttpService, private toastr: ToastrService, private cookieService: CookieService) { }
    ngOnInit() {
        // this.positionPoint = {
        //     latitude: 19.7514798,
        //     longitude: 75.7138884
        // };
        this.showPosition();
        this.getUserDetails();
        
       

    }


    getNearbyAuto() {
        this.httpService.getData(URL.nearByAuto + '/' + this.positionPoint.latitude + '/' + this.positionPoint.longitude).subscribe((res) => {
            this.nearByAutoList = res.body;
        }, (err) => {
            this.toastr.error(err);
        });
    }
    getUserDetails() {
        this.httpService.getData(URL.userDetials).subscribe((res) => {
            this.userDetails = res.body;
            if (this.userDetails.userType === 'user') {
                this.getNearbyAuto();
            }
        }, (err) => {
            this.toastr.error(err);
        });
    }

    bookAuto() {
        if (this.dropLoacation) {
            this.positionPoint.dropLocation = this.dropLoacation;
            
            this.httpService.update(URL.bookAuto, this.positionPoint).subscribe((res) => {
                if (res.status === 200) {
                    this.toastr.success(res.body.message);
                } else {
                    this.toastr.error(res.body.message);
                }

            }, (err) => {
                this.toastr.error(err);
            });
        }

    }

    updateBookingStatus(status) {
        let reqObj = {
            latitude: this.positionPoint.latitude,
            longitude: this.positionPoint.longitude,
            status: status
        }
        this.httpService.update(URL.update_booking, reqObj).subscribe((res) => {
            if (res.status === 200) {
                this.bookingStatus = res.body.message;
                this.toastr.success(res.body.message)
            } else {
                this.toastr.error(res.body.message);
            }

        }, (err) => {
            this.toastr.error(err);
        });
    }


    showPosition() {
        navigator.geolocation.getCurrentPosition((position) => {
            this.positionPoint = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }
            this.getNearbyAuto();
        });

    }
    getBookingDetails() {
        this.isBookingDetails = true;
        this.httpService.getData(URL.bookingDetails).subscribe((res) => {
            if (res.status === 200) {
                this.bookingDetails = res.body;
            } else {
                this.toastr.error(res.body.message);
            }

        }, (err) => {
            this.toastr.error(err);
        });
    }


}