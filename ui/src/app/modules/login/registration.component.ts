import { Component } from '@angular/core';
import { FormControl,FormGroup,Validators } from '@angular/forms'
@Component({
    selector:'app-registration',
    templateUrl: './registration.component.html',
    styleUrls:['./registration.component.scss']
})

export class RegistrationComponent {
    registrationForm:FormGroup
    constructor(){

    }
    ngOnInit(){
        this.registrationForm = new FormGroup({
            fullname: new FormControl(''),
            lastname: new FormControl(''),
            email: new FormControl(''),
            contactNum: new FormControl(''),
            password: new FormControl('')

        })
    }
    registration(){
        console.log(this.registrationForm)
    }
}