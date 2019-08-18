import { Component } from '@angular/core';
import { FormControl,FormGroup,Validators } from '@angular/forms';
import { HttpService } from '../../service/https_service/httpService';
import { URL } from '../../shared/url';
@Component({
    selector:'app-registration',
    templateUrl: './registration.component.html',
    styleUrls:['./registration.component.scss']
})

export class RegistrationComponent {
    registrationForm:FormGroup
    constructor(private httpService:HttpService){

    }
    ngOnInit(){
        this.registrationForm = new FormGroup({
            username: new FormControl(''),
            
            email: new FormControl(''),
            contactNum: new FormControl(''),
            password: new FormControl('')

        })
    }
    registration(){
        if(this.registrationForm.valid){
            this.httpService.save(URL.registerUser,this.registrationForm.value).subscribe((res)=>{
                console.log(res);
            })
        }
    }
}