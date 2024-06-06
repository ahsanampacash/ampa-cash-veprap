import { BehaviorSubject } from 'rxjs';

export class MerchantService {
  constructor() { }

  private savenumberSource = new BehaviorSubject(false);
  public saveNumber = this.savenumberSource.asObservable();

  updatesaveNumberFlag(flag: boolean) {
    this.savenumberSource.next(flag);
  }

  private savedPhoneNumberSource = new BehaviorSubject('');
  public savedPhoneNumber = this.savedPhoneNumberSource.asObservable();

  rememberSavedPhone(number: string) {
    this.savedPhoneNumberSource.next(number);
  }

  private saveCountryCodeSource = new BehaviorSubject('');
  public saveCountryCode = this.saveCountryCodeSource.asObservable();

  rememberCountryCode(country: any) {
    this.saveCountryCodeSource.next(country);
  }

  private socketStatusSource = new BehaviorSubject(1);
  public socketStatus = this.socketStatusSource.asObservable();
  updateSocketStatus(status: number) {
    //console.log("Merchant Service-Status updated to "+status)
    this.socketStatusSource.next(status);
  }

}
