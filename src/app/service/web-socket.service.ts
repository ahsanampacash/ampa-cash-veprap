import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs';
import * as Rx from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket; 
  constructor() { }

  connection(url) {
    //this.socket = io(environment.ws_url);//environment.ws_url
    this.socket = io(url);
    console.log('Connected');
  }
  sendMsg(TransactionNumber): Rx.Subject<MessageEvent> {
    console.log('in web socket service connected');
    let observable = new Observable(observer => {
      //TransactionNumber = 'AAA1';
      console.log('OutgoingTransaction_' + TransactionNumber);
      console.log(this.socket);
      this.socket.on('OutgoingTransaction_' + TransactionNumber, (data) => {
        console.log('OutgoingTransaction_' + TransactionNumber);
        observer.next(data);
      })
      return () => {
        this.socket.disconnect();
        console.log('return');
      }
    });

    let observer = {
      next: (data: Object) => {
        this.socket.emit('message1234', JSON.stringify(data));
        //console.log(data);
      },
    };
    return Rx.Subject.create(observer, observable);
  }
  disconnect() {
    this.socket.disconnect();
    console.log('disconnection');
  }

  getVideoLink(tnumber): Rx.Subject<MessageEvent> {

    let observable = new Observable(observer => {
      this.socket.on('expiryUrl_' + tnumber['key'], (data) => {
        console.log(data);
        console.log("Received message from Websocket Server");
        observer.next(data);
      })
      return () => {
        this.socket.disconnect();
        console.log('return');
      }
    });

    let observer = {
      next: (data: any) => {
        console.log(data);
        this.socket.emit('getExpiryUrl', JSON.stringify(data));
      },
    };
    return Rx.Subject.create(observer, observable);
  }  
}
