import { Component } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { HttpService } from '../../service/https_service/httpService';
import { URL } from '..//url';

@Component({
    selector: "app-navbar",
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
    isAuthenticated: any;
    constructor(private cookieService: CookieService,
        private router: Router,
        private httpService: HttpService) { }
    ngOnInit() {

    }
    logout() {
        this.httpService.save(URL.logout, {}).subscribe((res) => {
            this.cookieService.deleteAll();
            this.router.navigate(['/login']);
        }, (err) => {

        })

    }
}