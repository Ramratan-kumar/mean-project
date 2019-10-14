import { Component } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
@Component({
    selector: "app-navbar",
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent { 

    constructor(private cookieService: CookieService, private router:Router){}
    ngOnInit(){
    }
    logout(){
        this.cookieService.deleteAll();
        this.router.navigate(['/login']);
    }
}