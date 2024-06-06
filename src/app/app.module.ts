import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
//import { AppRoutingModule } from './app-routing.module';
//import { AppComponent } from './app.component';
import { HelloWorldComponent } from './hello-world/hello-world.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PopupComponent } from './popup/popup.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MerchantService } from './service/merchant.service';
import { ApiService } from './service/ApiService';
import { HttpClientModule } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgxMaskModule } from 'ngx-mask';
import { AppComponent } from './app.component';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
@NgModule({
  declarations: [
   AppComponent,
    HelloWorldComponent,
    PopupComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    //AppRoutingModule,
    MatDialogModule,
    FormsModule,
    HttpClientModule,
    MatProgressBarModule,
    NgxMaskModule.forRoot(),
    NgxIntlTelInputModule,
    BsDropdownModule
  ],
  entryComponents: [HelloWorldComponent, PopupComponent],
  providers: [MerchantService, ApiService],
  //bootstrap: [AppComponent]
})
export class AppModule {
  constructor(injector: Injector) {
    const custom = createCustomElement(HelloWorldComponent, { injector: injector });
    customElements.get('ampa-veprap') || customElements.define('ampa-veprap', custom);
    // customElements.get('ampa-cash') || customElements.define('ampa-cash', custom);
  }
  ngDoBootstrap() { }
}
