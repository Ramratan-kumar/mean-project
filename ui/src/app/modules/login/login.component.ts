import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { URL } from '../../shared/url';
import { HttpService } from '../../service/https_service/httpService';
import { CookieService } from 'ngx-cookie-service';
import { RouterLink,Router } from '@angular/router';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})

export class LoginComponent {
    loginForm: FormGroup
    constructor(private httpService: HttpService, private cookieService: CookieService,private router:Router) { }

    ngOnInit() {
        this.loginForm = new FormGroup({
            username: new FormControl(''),
            password: new FormControl('')
        })
    }
    login() {
        if (this.loginForm.valid) {
            this.httpService.save(URL.login, this.loginForm.value).subscribe((res) => {
                this.cookieService.set('token',res.headers.get('token'));
                this.cookieService.set('isAuthenticate','true');
                this.router.navigate(['/dashboard']);
            })
        }
    }
}