import { Component, OnInit, Input, Inject, ElementRef, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MerchantService } from '../service/merchant.service';
import { ApiService } from '../service/ApiService';
import { MessagesService } from '../service/messages.service';
import { NewWebsocketService } from '../service/newWebSocket.service';
import { NewMsgService } from '../service/newMsg.service';
import { Subscription, Observable, timer } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import * as QRCode from 'qrcode';

export interface DialogData {
  cartAmount: string;
  PayByAmpacash: boolean;
  PayByAmpaProduct: ProductModel;
  itemID: string;
  merchantId: string;
}

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css']
})
export class PopupComponent implements OnInit {
  @ViewChild('otp1Input') otp1Input: ElementRef;
  @ViewChild('otp2Input') otp2Input: ElementRef;
  @ViewChild('otp3Input') otp3Input: ElementRef;
  @ViewChild('otp4Input') otp4Input: ElementRef;
  @ViewChild('otp5Input') otp5Input: ElementRef;
  @ViewChild('otp6Input') otp6Input: ElementRef;

  pinDigits: string[] = Array(6).fill('');
  qrCodeData: string;
  serverIp: string;
  loader: boolean = false;
  receivedData: any;
  eventSource: EventSource | undefined;
  CountryCodeSelected: any = { code: '1', iso: 'us' };
  emptyMobilenumber: boolean;
  emptyOTP: boolean;
  validPin: boolean;
  successMessage: string;
  errorMessage: string;
  saveNumber: boolean;
  path: string;
  TransactionNumber: string;
  showDownloadDiv: boolean = false;
  PayByAmpacash: boolean = false;
  PayByAmpaProduct: ProductModel;
  OTPModel: OTPSubmit = {
    email: '1992maitri@gmail.com',
    otpin: '',
    phoneNumber: '',
    pNumber: '',
    amount: '1.30',
    merchantId: 'MERCHANT001',
    merchantUrl: 'http://amazon.com?item=001',
    merchantTransactionId: 'merchantx001',
    itemId: 'Item0123',
    action: 'payonline',
    tempId: '',
    shipping: '0.00',
    tax: '0.00',
    shippingAddress: '',
    items: [
    ],
    deliveryMode: 'D',
    isCartCheckout: false,
    isRepurchasingAllowed: true
  }
  isRepurchasingAllowed: boolean = true;
  usCountryCode: string = 'US';
  countryCode: string = this.usCountryCode;
  SelectedProduct: ProductModel;
  CartAmount: string = '0';
  ItemID: string = 'A';
  result: result = new result();
  @ViewChild('DownloadMicroPayLink', { static: false }) private DownloadMicroPayLink: ElementRef;
  @ViewChild('ViewMicroPayLink', { static: false }) private ViewMicroPayLink: ElementRef;
  socketResponse: MessageEvent;
  macroPayResultArraived: Boolean = false;
  private subscription: Subscription;
  private timer: Observable<any>;

  constructor(public matdialogref: MatDialogRef<PopupComponent>, private cdr: ChangeDetectorRef, private zone: NgZone, private wss: NewWebsocketService,
    @Inject(MAT_DIALOG_DATA) public dataDg: DialogData,
    private dataservice: MerchantService, private api: ApiService, private message: MessagesService, private newSocketMsg: NewMsgService) {
    this.CartAmount = dataDg.cartAmount;
    this.ItemID = dataDg.PayByAmpaProduct.itemID;
    this.PayByAmpacash = dataDg.PayByAmpacash;
    this.PayByAmpaProduct = dataDg.PayByAmpaProduct;
    this.result.data = new resultModel();
    this.result.data.success = false;
    this.result.data.message = "";
    this.result.data.transactionId = "";
    this.result.data.token = "";
    this.result.data.alreadyPurchased = false;
    if(dataDg.PayByAmpaProduct.isRepurchasingAllowed !== undefined) {
      this.OTPModel.isRepurchasingAllowed = dataDg.PayByAmpaProduct.isRepurchasingAllowed;
      this.isRepurchasingAllowed = dataDg.PayByAmpaProduct.isRepurchasingAllowed;
    }
    console.log("isRepurchasingAllowed: ", this.isRepurchasingAllowed);
    localStorage.removeItem("CloseItem");
    localStorage.removeItem('SelectedCountery');
    this.dataservice.saveNumber.subscribe(flag => this.saveNumber = flag);
    this.dataservice.savedPhoneNumber.subscribe(number => this.OTPModel.phoneNumber = number);
    this.dataservice.savedPhoneNumber.subscribe(number => {

      this.OTPModel.pNumber = number;

    });
    this.dataservice.saveCountryCode.subscribe(code => this.countryCode = code);
    if (localStorage != null) {
      if (localStorage.getItem('SelectedCountery') != null) {
        this.countryCode = localStorage.getItem('SelectedCountery');
      }
    }
    else {
      this.countryCode = this.usCountryCode;
      localStorage.setItem('SelectedCountery', this.countryCode);
    }
    if (this.countryCode == null || this.countryCode == '') {
      this.countryCode = this.usCountryCode;
    }

    // this.wss.connect(environment.devUrl);
    this.wss.connect("www.ampacash.com");
    this.establishSocket();
    this.dataservice.socketStatus.subscribe(status => {
      console.log("checking for socketstatus");
      // this.establishSocket();
      if (status == 0) {
        console.log("Got status 0")
        console.log(localStorage.getItem("CloseItem"))
        console.log("Went in If")
        this.newSocketMsg.connect();
        this.result.data.success = false;
        this.result.data.message = "Connection error occured, Please try again later.";
        if (this.TransactionNumber) {
          this.result.data.transactionId = this.OTPModel.merchantTransactionId;
          this.result.data.token = "";
        }
        this.matdialogref.close({ data: this.result });
      }
    });
    const apiRequest = {
      merchantId: this.dataDg.merchantId
    };
    this.api.initiateAPI('merchant/server-config', apiRequest).subscribe(data=> {
      console.log("Server Data", data);
      this.serverIp = data['serverIp'] + ':' + data['portNumber'];
    });

    this.qrCodeData = JSON.stringify({
      merchantId: this.dataDg.merchantId,
      itemId: this.ItemID,
      itemName: dataDg.PayByAmpaProduct.Name,
      itemPrice: this.CartAmount
    });
  }

  
  handleInputChange(event: any, index: number): void {
    const value = event.target.value;

    if (value && value.length > 0 && index < this.pinDigits.length - 1) {
      this.focusInput(index + 1);
    }
  }

  handleKeyDown(event: KeyboardEvent, index: number): void {
    if (event.keyCode === 8 && index > 0) {
      this.pinDigits[index] = ''; // Clear the current input
      this.focusInput(index - 1);
    }

    if (event.keyCode === 9 && index === 5 && !event.shiftKey) {
      event.preventDefault(); // Prevent default tab behavior
      // Focus on the checkbox after the phone number field
      const checkbox = document.getElementById('checkboxId');
      if (checkbox) {
        checkbox.focus();
      }
    }
  }

  focusInput(index: number): void {
    switch (index) {
      case 0:
        this.otp1Input.nativeElement.focus();
        break;
      case 1:
        this.otp2Input.nativeElement.focus();
        break;
      case 2:
        this.otp3Input.nativeElement.focus();
        break;
      case 3:
        this.otp4Input.nativeElement.focus();
        break;
      case 4:
        this.otp5Input.nativeElement.focus();
        break;
      case 5:
        this.otp6Input.nativeElement.focus();
        break;
      default:
        break;
    }
  }
  
  establishSocket() {
    this.newSocketMsg.newMsgs.subscribe(msg => {
      console.log("Listening from websocket");
      console.log(msg);
      this.newSocketMsg.connect();
      this.socketResponse = msg;

      if (this.socketResponse.data != null || this.socketResponse.data != undefined) {
        let res = JSON.parse(this.socketResponse.data);
        console.log("res", res);


        if (res['tempId'] == this.OTPModel.tempId) {
          if (res['error'] == true) {
            console.log('error');
            this.loader = false;
            this.errorMessage = res['errorMsg'];
            this.result.data.success = false;
            this.result.data.message = res['errorMsg'];
            if (this.OTPModel.merchantTransactionId) {
              this.result.data.transactionId = this.OTPModel.merchantTransactionId;
            }
            this.result.data.token = res['token'];
            this.result.data.alreadyPurchased = res['alreadyPurchased'];
            console.log(this.result);
            this.matdialogref.close({ data: this.result });
          }
          // //Commenting it because we are gonna disconnect the socket and listen the response with SSE instead.
          // else if (this.TransactionNumber != null && this.TransactionNumber == res['ampaTransactionNumber'] && res['error'] == false) {
          //   console.log('Case of approval');
          //   //console.log(this.TransactionNumber);
          //   this.macroPayResultArraived = true;
          //   if (res['approved']) {
          //     this.result.data.success = true;
          //     this.successMessage = 'User Payment Approved.';// Click below to download';
          //     this.result.data.message = 'User Payment Approved.';
          //   }
          //   else {
          //     this.successMessage = '';
          //     this.errorMessage = 'Sorry, User declined transaction';
          //     this.result.data.success = false;
          //     this.result.data.message = 'Sorry, User declined transaction';

          //   } this.loader = false;
          //   this.matdialogref.close({ data: this.result });
          // }
          else if (res['error'] == false) {
            this.result.data.success = true;
            this.errorMessage = '';
            this.TransactionNumber = res['ampaTransactionNumber'];
            if (parseFloat(this.CartAmount.toString()) <= 2) {
              console.log('Wait for Micro payment response from Backend');
              console.log("this.socketResponse.data", this.socketResponse.data);
              this.successMessage = 'Payment Received. Click below to view or download';// Click below to View or Download';
              this.result.data.message = 'Payment Received. Click below to view or download';
              if (this.OTPModel.merchantTransactionId) {
                this.result.data.transactionId = this.OTPModel.merchantTransactionId;
              }
              this.result.data.token = res['token'];
              this.result.data.alreadyPurchased = res['alreadyPurchased'];
              this.loader = false;
              this.closeDialog();
            }
            else {
              console.log('Wait for Macro payment response from Backend: res', res);
              this.successMessage = 'Awaiting your approval on your device';
              this.TransactionNumber = res['transactionNumber'];
              this.disconnect();

              if (this.TransactionNumber) {
                this.eventSource = new EventSource(this.serverIp + `/events/${this.TransactionNumber}`);
                console.log("this.TransactionNumber", this.TransactionNumber);
                this.eventSource.onmessage = (event) => {
                  const data = JSON.parse(event.data);
                  console.log("event data", data);
                  this.receivedData = data;

                  if (this.receivedData['tempId'] == this.OTPModel.tempId && this.receivedData['error'] == false) {
                    if (this.TransactionNumber != null && this.TransactionNumber == this.receivedData['ampaTransactionNumber'] && this.receivedData['error'] == false) {
                      console.log('Case of approval');
                      console.log(this.TransactionNumber);
                      this.macroPayResultArraived = true;
                      if (this.receivedData['approved']) {
                        this.result.data.success = true;
                        this.successMessage = 'User Payment Approved.';// Click below to download';
                        this.result.data.message = 'User Payment Approved.';
                        if (this.receivedData['ampaTransactionNumber']) {
                          this.result.data.transactionId = this.OTPModel.merchantTransactionId;
                        }
                        this.result.data.token = this.receivedData['token'];
                        this.result.data.alreadyPurchased = this.receivedData['alreadyPurchased'];
                        console.log("this.result.data.message: ", this.result.data.message);
                      }
                      else {
                        this.successMessage = '';
                        this.errorMessage = 'Sorry, User declined transaction';
                        this.result.data.success = false;
                        this.result.data.message = 'Sorry, User declined transaction';
                        if (this.receivedData['ampaTransactionNumber']) {
                          this.result.data.transactionId = this.OTPModel.merchantTransactionId;
                        }
                        this.result.data.token = this.receivedData['token'];
                        this.result.data.alreadyPurchased = this.receivedData['alreadyPurchased'];
                        console.log("this.result.data.message: ", this.result.data.message);

                      }
                    }
                  }
                  else {
                    if (this.receivedData["errorDescription"]) {
                      console.log('Error for closing' + this.receivedData["errorDescription"]);
                      this.result.data.message = this.receivedData["errorDescription"];
                    }
                    else {
                      this.result.data.message = 'Transaction ended from Browser'; 
                    }
                    this.result.data.success = false;
                    this.loader = false;
                    this.matdialogref.close({ data: this.result });
                  }
                  this.loader = false;

                  this.zone.run(() => {
                    this.matdialogref.close({ data: this.result });
                  });
                  if (this.eventSource) {
                    this.eventSource.close();
                  }
                  this.cdr.detectChanges();
                };

              }
            }
          }
          else {
            if (res["message"]) {
              console.log('Error for closing' + res["message"]);
              this.result.data.message = res["message"];
              if (this.OTPModel.merchantTransactionId) {
                this.result.data.transactionId = this.OTPModel.merchantTransactionId;
              }
              this.result.data.token = res['token'];
              this.result.data.alreadyPurchased = res['alreadyPurchased'];
            }
            else {
              console.log('Error for closing' + res["errorMsg"]);
              this.result.data.message = res["errorMsg"];
              if (this.OTPModel.merchantTransactionId) {
                this.result.data.transactionId = this.OTPModel.merchantTransactionId;
              }
              this.result.data.token = res['token'];
              this.result.data.alreadyPurchased = res['alreadyPurchased'];
            }

            this.result.data.success = false;
            this.loader = false;
            this.matdialogref.close({ data: this.result });
          }
        } else {
          if (res["message"]) {
            console.log('Error for closing' + res["message"]);
            this.result.data.message = res["message"];
            if (this.OTPModel.merchantTransactionId) {
              this.result.data.transactionId = this.OTPModel.merchantTransactionId;
            }
            this.result.data.token = res['token'];
            this.result.data.alreadyPurchased = res['alreadyPurchased'];
          }
          else {
            console.log('Error for closing' + res["errorMsg"]);
            this.result.data.message = res["errorMsg"];
            if (this.OTPModel.merchantTransactionId) {
              this.result.data.transactionId = this.OTPModel.merchantTransactionId;
            }
            this.result.data.token = res['token'];
            this.result.data.alreadyPurchased = res['alreadyPurchased'];
          }
          this.result.data.success = false;
          this.loader = false;
          this.matdialogref.close({ data: this.result });
        }
      }
      else {
        console.log("socketResponse is null")
      }
    });
  }

  ngOnInit(): void {
    if (!this.saveNumber) {
      this.dataservice.rememberSavedPhone('');
    }
    else {
      //this.ChangePhone();
      try {
        this.OTPModel.pNumber = this.OTPModel.pNumber.toString().replace(/[^0-9]/g, "");
        if (this.OTPModel.pNumber.toString().length >= 10)
          this.OTPModel.pNumber = this.formatN(this.OTPModel.pNumber, '(###)-###-####')
      }
      catch (e) {
        console.log('incatch')
      }
      //console.log(this.OTPModel.pNumber)
    }
    if (localStorage != null) {
      if (localStorage.getItem('SelectedCountery') != null) {
        this.countryCode = localStorage.getItem('SelectedCountery');
      }
    }
    else {
      this.countryCode = this.usCountryCode;
      localStorage.setItem('SelectedCountery', this.countryCode);
    }
    if (this.countryCode == null || this.countryCode == '') {
      this.countryCode = this.usCountryCode;
    }
    this.generateQRCode();
    this.receivedData = null;
  }

  generateQRCode() {
    QRCode.toDataURL(this.qrCodeData)
      .then(url => {
        const qrCodeImg = document.getElementById('qrCodeImg');
        if (qrCodeImg) {
          qrCodeImg.setAttribute('src', url);
        }
      })
      .catch(err => {
        console.error('Error generating QR code:', err);
      });
  }
  
  addSpaces(text: string): string {
    return text.replace(/([A-Z])/g, ' $1').trim();
  }


  OtpSubmit() {
    this.OTPModel.otpin = this.pinDigits.join('');
    console.log('PIN:', this.OTPModel.otpin);
    if (this.saveNumber) {
      this.dataservice.updatesaveNumberFlag(true);
    }
    else {
      this.dataservice.updatesaveNumberFlag(false);
    }
    this.validateForm();

  }

  getAppStoreLink(): string {
    const userAgent = window.navigator.userAgent || window.navigator.vendor;
    
    // Detect if the user is using an Apple device
    if (/iPad|iPhone|iPod|Mac/.test(userAgent) || navigator.userAgent.indexOf("Mac")!=-1) {
      return 'https://apps.apple.com/in/app/ampacash-mobile-payment-app/id1507879136';
    } else {
      return 'https://play.google.com/store/apps/details?id=com.ampacash';
    }
  }
  
  validateForm() {
    // this.OTPModel.phoneNumber = this.OTPModel.pNumber;
    if (this.OTPModel.pNumber == '' || this.OTPModel.pNumber == null) {
      this.emptyMobilenumber = true;
    }
    else if (this.OTPModel.otpin == '' || this.OTPModel.otpin == null) {
      this.emptyMobilenumber = false;
      this.emptyOTP = true;
    }
    else if (this.OTPModel.otpin !== '' && this.OTPModel.otpin.length <= 5) {
      this.emptyMobilenumber = false;
      this.emptyOTP = false;
      this.validPin = true;
    }
    else {
      var a = this.OTPModel.pNumber['e164Number'];
      if (a) {
        var phone = a.replace(/[\s]/g, '');
        phone = phone.replace('+', '');
        this.OTPModel.phoneNumber = phone;
      }
      this.loader = true;
      this.emptyMobilenumber = false;
      this.emptyOTP = false;
      this.validPin = false;
      this.OTPModel.merchantTransactionId = 'M_' + Math.floor(100000 + Math.random() * 900000);
      this.OTPModel.amount = this.CartAmount;
      this.OTPModel.phoneNumber = this.OTPModel.phoneNumber;
      //this.OTPModel.phoneNumber = this.CountryCodeSelected.code + this.OTPModel.phoneNumber;
      this.OTPModel.merchantId = this.dataDg.merchantId;
      this.OTPModel.email = this.dataDg.PayByAmpaProduct.email;
      this.OTPModel.merchantUrl = this.dataDg.PayByAmpaProduct.merchantUrl;
      this.OTPModel.itemId = this.dataDg.PayByAmpaProduct.itemID;

      this.OTPModel.action = 'payonline';
      this.OTPModel.tempId = Math.floor(100000 + Math.random() * 900000).toString();

      this.OTPModel.itemId = this.dataDg.PayByAmpaProduct.itemID;
      this.OTPModel.isCartCheckout = this.dataDg.PayByAmpaProduct.isCartCheckout;
      this.OTPModel.deliveryMode = this.dataDg.PayByAmpaProduct.deliveryMode;
      if (this.OTPModel.isCartCheckout) {
        this.OTPModel.items = this.dataDg.PayByAmpaProduct.items;
      }
      if (this.dataDg.PayByAmpaProduct.shippingAddress) {
        this.OTPModel.shippingAddress = this.dataDg.PayByAmpaProduct.shippingAddress;
        this.OTPModel.shipping = this.dataDg.PayByAmpaProduct.shipping;
        this.OTPModel.tax = this.dataDg.PayByAmpaProduct.tax;
      }

      this.newSocketMsg.connect();
      this.newSocketMsg.newMsgs.next(this.OTPModel);
      const timeToWait = 3 * 60 * 1000;
      this.timer = timer(timeToWait);
      this.subscription = this.timer.subscribe(() => {
        if (this.loader == true && this.macroPayResultArraived == false) {
          this.loader = false;
          this.result.data.success = false;
          this.result.data.message = 'Transaction approval not received from buyer’s device. Transaction declined.';
          
          if (this.OTPModel.merchantTransactionId) {
            this.result.data.transactionId = this.OTPModel.merchantTransactionId;
          }
          this.matdialogref.close({ data: this.result });
        }
        else {
          // console.log("coming Here");
          this.newSocketMsg.connect();
        }
      })

    }

  }

  closeDialog() {
    console.log(this.result);
    this.matdialogref.close({ data: this.result });
  }

  closeDialogBtn() {
    console.log(this.result);
    this.result.data.success = false;
    this.result.data.message = 'User declined the transaction.';
    this.matdialogref.close({ data: this.result });
  }

  ngOnDestroy() {
    this.disconnect();

    if (this.eventSource) {
      this.eventSource.close();
    }
  }
  disconnect() {
    this.newSocketMsg.newMsgs.unsubscribe();
    this.newSocketMsg.disconnect();
  }

  saveNumberChecked() {
    if (this.OTPModel.pNumber) {
      this.countryCode = this.OTPModel.pNumber == null ? this.usCountryCode : this.OTPModel.pNumber['countryCode'];
      console.log(this.OTPModel.pNumber)
      if (this.saveNumber) {
        this.saveNumber = false;
        this.countryCode = this.OTPModel.pNumber == null ? this.usCountryCode : this.OTPModel.pNumber['countryCode'];
        this.dataservice.updatesaveNumberFlag(false);
        localStorage.setItem('SelectedCountery', this.countryCode);
      }
      else {
        this.saveNumber = true;
        this.dataservice.updatesaveNumberFlag(true);
        //console.log(this.OTPModel.pNumber)
        if (this.OTPModel.pNumber) {
          this.emptyMobilenumber = false;
          // console.log(this.OTPModel.pNumber['number'])
          this.dataservice.rememberSavedPhone(this.OTPModel.pNumber['number']);
          this.dataservice.rememberCountryCode(this.countryCode);
        }
        else {
          this.emptyMobilenumber = true;
        }
        localStorage.setItem('SelectedCountery', this.countryCode);
      }
    }
  }

  ChangePhone() {
    console.log("inside change event: ", this.OTPModel.pNumber)
    var a = this.OTPModel.pNumber['e164Number'];
    var numberWithoutCountryCode = this.OTPModel.pNumber['e164Number'].replace(this.OTPModel.pNumber['dialCode'], '');
    var countryCode = this.OTPModel.pNumber['countryCode'];
    try {
      //console.log(a);
      if (a) {
        var phone = a.replace(/[\s]/g, '');
        phone = phone.replace('+', '');
        this.OTPModel.phoneNumber = phone;
      }
      if (this.saveNumber) {
        this.countryCode = this.OTPModel.pNumber == null ? this.usCountryCode : this.OTPModel.pNumber['countryCode'];
        this.dataservice.updatesaveNumberFlag(true);
        //console.log(this.OTPModel.pNumber['number'])
        this.dataservice.rememberSavedPhone(this.OTPModel.pNumber['number']);
        this.dataservice.rememberCountryCode(this.countryCode);
        localStorage.setItem('SelectedCountery', this.countryCode);
      }

      this.OTPModel.pNumber = this.OTPModel.pNumber['number'] == null ? this.OTPModel.pNumber : this.OTPModel.pNumber['number'].toString().replace(/[^0-9]/g, "");
      
      console.log("Formatting number: ", numberWithoutCountryCode, countryCode);
      if (numberWithoutCountryCode.toString().length >= 10 && countryCode == 'US') {
        this.OTPModel.pNumber = this.formatN(numberWithoutCountryCode, '(###)-###-####');
        console.log("Number formatted: ", this.OTPModel.pNumber);
      }
    }
    catch (e) {
      console.log(e);
    }
  }

  formatN(value, pattern) {
    var i = 0,
      v = value.toString();

    return pattern.replace(/#/g, _ => v[i++]);
  }

  public loadScript() {
    let node = document.createElement('script');

    node = document.createElement('script');
    node.src = 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/23.1.0/js/intlTelInput.js';
    node.type = 'text/javascript';
    document.getElementsByTagName('head')[0].appendChild(node);

    document.getElementsByTagName('head')[0].appendChild(node);
    node = document.createElement('script');
    node.src = 'https://veprap.s3.us-west-2.amazonaws.com/intlTelInputCountryCustom.js';
    node.type = 'text/javascript';
    document.getElementsByTagName('body')[0].appendChild(node);
  }
}
export class OTPSubmit {
  email: string;
  otpin: string;
  phoneNumber: string;
  pNumber: string;
  amount: string;
  merchantId: string;
  merchantUrl: string;
  merchantTransactionId: string;
  itemId: string;
  action: string = 'payonline';
  tempId: string = '';
  items: any = [];
  isCartCheckout: false;
  shipping: string;
  tax: string;
  shippingAddress: string;
  deliveryMode: string;
  isRepurchasingAllowed: boolean;
}

export class ProductModel {
  Amount: string;
  Name: string;
  itemID: string;

  Genre: string;
  email: string;
  merchantUrl: string;
  items: any = [];
  isCartCheckout: false;
  shipping: string;
  tax: string;
  shippingAddress: string;
  deliveryMode: string;
  isRepurchasingAllowed: boolean;
}

export class result {
  data: resultModel;
}

export class resultModel {
  success: boolean;
  message: string;
  token: string;
  transactionId: string;
  cartAmount: string;
  itemID: string;
  alreadyPurchased: boolean;
}
