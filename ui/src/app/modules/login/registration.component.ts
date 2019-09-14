import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../service/https_service/httpService';
import { URL } from '../../shared/url';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-registration',
    templateUrl: './registration.component.html',
    styleUrls: ['./registration.component.scss']
})

export class RegistrationComponent {
    registrationForm: FormGroup;
    submitted: boolean;
    constructor(private httpService: HttpService,private toastr:ToastrService) {

    }
    ngOnInit() {
        this.registrationForm = new FormGroup({
            fullname: new FormControl('', [Validators.required]),
            email: new FormControl('', [Validators.required, Validators.pattern(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)]),
            contactNum: new FormControl('', [Validators.required, Validators.pattern(/^(\+\d{1,3}[- ]?)?\d{10}$/)]),
            password: new FormControl('', [Validators.required, Validators.minLength(8)])

        })
    }
    registration() {
        this.submitted = true;
        if (this.registrationForm.valid) {
            this.submitted = false;
            this.httpService.save(URL.registerUser, this.registrationForm.value).subscribe((res) => {
                console.log(res);
                this.toastr.success('hello',res.message)
            });
        }
    }
}
