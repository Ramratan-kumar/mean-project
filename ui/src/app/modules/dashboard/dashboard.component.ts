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
    gender: any;
    userDetails: any;
    constructor(private httpService: HttpService, private toastr: ToastrService, private cookieService:CookieService) { }
    ngOnInit() {
        this.getUserDetails();
    }

    getUserDetails() {
        this.httpService.getData(URL.userDetials).subscribe((res) => {
            this.userDetails = res.body;
            this.gender = this.userDetails.gender;
        }, (err) => {
            this.toastr.error(err);
        });
    }

    updateGenderUser(value) {
        let reqObj = {
            gender: value
        }
        this.httpService.update(URL.updateGender, reqObj).subscribe((res) => {
            if (res.status === 200) {
                this.gender = value;
                this.toastr.success(res.body.message);
                this.cookieService.set('token',res.headers.get('token'));
            } else {
                this.toastr.error(res.body.message);
            }

        }, (err) => {
            this.toastr.error(err);
        });
    }

}