import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, JsonpClientBackend, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators'
import { environment } from '../../../environments/environment';
import {CookieService } from 'ngx-cookie-service';

@Injectable()
export class HttpService {
    header_options: any;
    constructor(private http: HttpClient,private cookieService:CookieService) {

    }

    setHeader() {
        let authorizedToken = this.cookieService.get('token');
        this.header_options = new HttpHeaders({ 'Content-Type': 'application/json' })
            .set('Access-Control-Allow-Origin', '*')
            .set('Authorization', `Bearer $authorizedToken`)
            

    }

    save(url: string, data: any): Observable<any> {
        this.setHeader();
        return this.http.post(environment.base_url + url, data, 
            { headers: this.header_options, observe: 'response' })
            .pipe(tap(res => console.log(res)), catchError(this.handleError));
    }
    getData(url: string): Observable<any> {
        return this.http.get(environment.base_url + url, 
            { headers: this.header_options, observe: 'response' }).pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse) {
        if (error.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            console.error('An error occurred:', error.error.message);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            console.error(
                `Backend returned code ${error.status}, ` +
                `body was: ${error.error}`);
        }
        // return an observable with a user-facing error message
        return throwError(
            'Something bad happened; please try again later.');
    };

}