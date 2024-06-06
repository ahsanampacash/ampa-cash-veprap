import { Injectable } from '@angular/core';
import { WebSocketService } from './web-socket.service';
import { Subject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  messages: Subject<any>;
  videoLink: Subject<any>;
  constructor(private wsService: WebSocketService) { }
  sendMsg(TransactionNumber) {
    console.log('in message service');
    this.messages = <Subject<any>>this.wsService
      .sendMsg(TransactionNumber)
      .pipe((response: any): any => { 
        
        return response;
      })
    console.log(this.messages);
    this.messages.next();
  }

  connect(url) {
    this.wsService.connection(url);
  }
  disconnect() {
    this.wsService.disconnect();
  }
  getVideoLink(msg) {
    this.videoLink = <Subject<any>>this.wsService
      .getVideoLink(msg)
      .pipe((response: any): any => {
        return response;
      })
    this.videoLink.next(msg);
  }
}
