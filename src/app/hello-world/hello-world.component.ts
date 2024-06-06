import { Component, OnInit, Input, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PopupComponent, DialogData } from '../popup/popup.component';
import * as jquery from 'jquery';
@Component({
  // selector: 'ampa-cash',
  selector: 'ampa-veprap',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './hello-world.component.html',
  styleUrls: ['./hello-world.component.css']
})
export class HelloWorldComponent implements OnInit {
  cartamount: string;
  @Input() paybyampacash = true;
  @Input() paybyampaproduct: any;//=' { "Amount": "11", "Name": "The Black Hole", "Genre": "Cartoons", "itemID": "1234567", "merchantUrl": "www.goole.com", "email": "mili@mailinator.com" }';
  @Input() merchantid: any;//= '55F08AA90';//dev
  //@Input() merchantid: any = '417277975';//prod
  //@Input() socketUrl;//='http://34.222.142.10';
  //@Input() port;//='5000';
  @Output() onsuccess = new EventEmitter();
  dialogResponse: any;
  objModel: ProductModel;
  result: result = new result();
  validate: boolean;
  phoneNumber: any;
  constructor(private dialog: MatDialog) {
    //console.log('Ampacash Element Constructed');
    this.result.data = new resultModel();
    this.result.data.success = true;
    this.result.data.message = 'On Load';
    this.onsuccess.emit(this.result);
  }

  ngOnInit(): void {
    console.log('Ampacash Element Initialized');
  }
  validateInputs() {
    this.validate = true;
    this.result.data = new resultModel();
    if (this.merchantid == null) {
      this.result.data.success = false;
      this.result.data.message = 'Please Enter Merchant ID.';
      //console.log(this.result);
      this.onsuccess.emit(this.result);
      this.validate = false;
    }
    else if (this.paybyampaproduct == null) {
      this.result.data.success = false;
      this.result.data.message = 'Please Enter Selected Product.';
      //console.log(this.result);
      this.onsuccess.emit(this.result);
      this.validate = false;
     
    }
  }
  opendialog() {
    //console.log(this.paybyampaproduct);
    //console.log(this.merchantid);
    this.validateInputs();
    if (this.paybyampaproduct != null) {
      this.objModel = new ProductModel();
      this.objModel = JSON.parse(this.paybyampaproduct);
      this.cartamount = this.objModel.Amount;
    }
    if (this.validate==true) {
      jquery('.cdk-overlay-container').css('display', 'block');
      const dialogRef = this.dialog.open(PopupComponent, {
        data: {
          cartAmount: this.cartamount, PayByAmpacash: true, PayByAmpaProduct: this.objModel,
          merchantId: this.merchantid
        }

      });
      dialogRef.afterClosed().subscribe(result => {
        var data = result.data.data.message;
        console.log(data);
        this.onsuccess.emit(result);
        this.dialogResponse = data;
        jquery('.cdk-overlay-container').hide();
        //alert(result['success']);

      });
    }
  }
}
export class ProductModel {
  Amount: string;
  Name: string;
  itemID: string;
  Genre: string;
  email: string;
  merchantUrl: string;
}
export class result {
  data: resultModel;
}
export class resultModel {
  success: boolean;
  message: string;
}
