import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root'
})
export class AuthGaurd implements CanActivate {
  constructor(private cookieService: CookieService,private router:Router) { }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      console.log(state.url);
    if (this.cookieService.get('isAuthenticate') === 'true') {
      return true;
    }
    this.router.navigate(['/']);
    return false;
  }
} 