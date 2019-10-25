import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { URL } from '../../shared/url';
import { HttpService } from '../../service/https_service/httpService';
import { CookieService } from 'ngx-cookie-service';
import { RouterLink,Router,ActivatedRoute } from '@angular/router';
import * as cryptoJs from 'crypto-js' ;
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})

export class LoginComponent {
    loginForm: FormGroup;
    submitted:boolean;
    positionPoint:any;
    constructor(private httpService: HttpService,
         private cookieService: CookieService,
         private router:Router,
         private toastr:ToastrService) { }

    ngOnInit() {
        this.loginForm = new FormGroup({
            username: new FormControl('',[Validators.required]),
            password: new FormControl('',[Validators.required, Validators.minLength(8)])
        });
        this.getPosition();
    }
    login() {
        this.submitted = true;
        if (this.loginForm.valid) {
            this.submitted = false;
            var hash = cryptoJs.SHA256(this.loginForm.value.password);
            this.loginForm.value.password = hash.toString(cryptoJs.enc.Hex);
            let reqObj = this.loginForm.value;
            reqObj.location = this.positionPoint;
            this.httpService.save(URL.login, reqObj).subscribe((res) => {
                this.cookieService.set('token',res.headers.get('token'));
                this.cookieService.set('isAuthenticate','true');
                this.router.navigate(['/dashboard']);
            },(err)=>{
                this.toastr.error(err);
            });
        }
    }
    getPosition() {
        navigator.geolocation.getCurrentPosition((position) => {
            this.positionPoint = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }
            
        });

    }
}