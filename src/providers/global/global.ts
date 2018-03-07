import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

// Models
import { User } from '../../models/user';

@Injectable()
export class GlobalProvider {
  public user: User = {} as User;

  constructor(public http: Http) {
    console.log('Hello GlobalProvider Provider');
  }

}
