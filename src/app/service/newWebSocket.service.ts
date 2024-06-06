import { Injectable } from "@angular/core";
import * as Rx from "rxjs";
import { environment } from '../../environments/environment.prod';
import { MerchantService } from './merchant.service';
@Injectable({
  providedIn: 'root'
})
export class NewWebsocketService {
  ws: any;
  isPopupDisplayed = false;
  overlay: HTMLElement;
  constructor(private merchant: MerchantService) {
  }

  private subject: Rx.Subject<MessageEvent>;

  public connect(url): any {
    if (!this.subject || this.ws.readyState != WebSocket.OPEN) {
      this.subject = this.create(url);
    }    
    return this.subject;
  }

  private create(url): Rx.Subject<MessageEvent> {
    //let ws = new WebSocket(url);
    this.ws = new WebSocket(url);
    console.log('Socket Connected - Angular');
    this.merchant.updateSocketStatus(1);
    let observable = Rx.Observable.create((obs: Rx.Observer<MessageEvent>) => {
      this.ws.onopen = obs.next.bind(obs);
      this.ws.onmessage = obs.next.bind(obs);
      this.ws.onerror = (errorEvent) => {console.error('WebSocket error:', errorEvent);this.reconnect();}
      this.ws.onclose = obs.next.bind(obs);
      return this.ws.close.bind(this.ws);
    });
    let observer = {
      next: (data: Object) => {
        console.log(data);
        console.log(this.ws.readyState);
        if (this.ws.readyState === WebSocket.OPEN) {
          console.log('Data Sent to Backend');
          
            this.ws.send(JSON.stringify(data));
            localStorage.removeItem("CloseItem")
          
        }
        else {
          console.log("Need to call Socket again")
          //this.merchant.updateSocketStatus(this.ws.readyState);
          let self = this;
          setTimeout(function () {
            // self.connect(environment.devUrl);
            self.connect("www.ampacash.com");
            self.merchant.updateSocketStatus(0);
          }, 3000);
        }
      }
    };
    return Rx.Subject.create(observer, observable);
  }
  
  reconnect() {
    console.log("reconnecting socket after being destroyed");
    const isAppleDevice = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
    const isSafari = /^((?!Chrome|CriOS|FxiOS|EdgiOS|Opera|OPiOS|Firefox).)*Safari/i.test(navigator.userAgent);
  
    if (isAppleDevice && isSafari) {
      this.showOverlay(
        "A connection problem has occurred. If your browser is Safari, please make sure the 'NSURLSession Websocket' option is turned off. You can turn it off by following these steps:",
        "Navigate to Safari Settings > Advanced > Experimental Features > NSURLSession Websocket > OK. If the option is enabled, deactivate it and refresh the page."
      );
    } else {
      this.showOverlay("", "The connection interrupted. Please try again.");
    }
  
    // this.connect(environment.devUrl);
    this.connect("www.ampacash.com");
  }
  

showOverlay(message, instruction) {
  console.log("inside overLay");
  if (!this.isPopupDisplayed) {
    this.isPopupDisplayed = true;
    this.overlay = document.createElement('div') as HTMLElement;
    this.overlay.className = 'custom-overlay';
    this.overlay.innerHTML = `
      <div class="custom-modal">
        <div class="error-icon">&#9888;</div>
        <div class="custom-modal-content">
          <p>${message}</p>
          <p style="color:red">${instruction}</p>
          <button class="close-button" onclick="closeOverlay()">OK</button>
        </div>
      </div>
    `;
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;
    (this.overlay.querySelector('.custom-modal') as HTMLElement).style.cssText = `
      background-color: white;
      border: 1px solid #ccc;
      box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
      padding: 20px;
      width: 350px;
      text-align: center;
      border-radius: 1.2rem;
    `;
    (this.overlay.querySelector('.error-icon') as HTMLElement).style.cssText = `
      font-size: 35px;
      color: white;
      border-radius: 50px;
      border: 2px solid #ff5757;
      width: 59px;
      text-align: center;
      margin: 0 auto 3rem;
      padding-bottom: 5px;
      background-color: #ff5757;
    `;
    (this.overlay.querySelector('.close-button') as HTMLElement).style.cssText = `
      font-size: 16px;
      padding: 5px;
      cursor: pointer;
      background-color: #1b559b;
      color: white;
      border: none;
      border-radius: 4px;
      margin-top: 20px;
      width: 90px;
    `;

    document.body.appendChild(this.overlay);

    window['closeOverlay'] = () => {
      this.closeOverlay();
      this.merchant.updateSocketStatus(0);
    };
  }
}

closeOverlay() {
    if (this.overlay) {
        document.body.removeChild(this.overlay);
        this.overlay = null;
    }
        this.disconnect();
}
  
  public disconnect() {
    this.ws.close();
    this.subject = null;
  }

}
