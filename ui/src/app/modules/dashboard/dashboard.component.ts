import { Component } from '@angular/core';
import { HttpService } from '../../service/https_service/httpService';
import { URL } from '../../shared/url';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: "app-dashbord",
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent {
    gender: any;
    userDetails: any;
    constructor(private httpService: HttpService, private toastr: ToastrService, ) { }
    ngOnInit() {
        this.getUserDetails();
    }

    getUserDetails() {
        this.httpService.getData(URL.userDetials).subscribe((res) => {
            this.userDetails = res.body;
        }, (err) => {
            this.toastr.error(err);
        });
    }

    updateGenderUser(value) {
        let reqObj = {
            userId: this.userDetails?this.userDetails._id:'',
            gender: value
        }
        this.httpService.update(URL.updateGender, reqObj).subscribe((res) => {
            if (res.status === 200) {
                this.gender = value;
                this.toastr.success(res.body.message);
            } else {
                this.toastr.error(res.body.message);
            }

        }, (err) => {
            this.toastr.error(err);
        });
    }

}