import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute,Router } from '@angular/router';
import { HttpService } from '../../service/https_service/httpService';
import { URL } from '../../shared/url';
import { ToastrService } from 'ngx-toastr';
import * as cryptoJs from 'crypto-js' ;

@Component({
    selector: 'app-registration',
    templateUrl: './registration.component.html',
    styleUrls: ['./registration.component.scss']
})

export class RegistrationComponent {
    registrationForm: FormGroup;
    submitted: boolean;
    constructor(private httpService: HttpService,private toastr:ToastrService,
        private activatedRoute:ActivatedRoute,private router:Router) {

    }
    ngOnInit() {
        this.registrationForm = new FormGroup({
            name: new FormControl('', [Validators.required]),
            email: new FormControl('', [Validators.required, Validators.pattern(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)]),
            contactNum: new FormControl('', [Validators.required, Validators.pattern(/^(\+\d{1,3}[- ]?)?\d{10}$/)]),
            password: new FormControl('', [Validators.required, Validators.minLength(8)]),
            userType: new FormControl('')

        })
    }
    registration() {
        this.submitted = true;
        if (this.registrationForm.valid) {
            this.submitted = false;
            var hash = cryptoJs.SHA256(this.registrationForm.value.password);
            this.registrationForm.value.password = hash.toString(cryptoJs.enc.Hex);
            this.httpService.save(URL.registerUser, this.registrationForm.value).subscribe((res) => {
                if(res.status === 200){
                    this.toastr.success(res.body.message);
                    this.router.navigate(['./login']);
                }else if(res.status === 206){
                    this.toastr.error(res.body.message);
                }
                
            },(err)=>{
                this.toastr.error(err);
            });
        }
    }
}
