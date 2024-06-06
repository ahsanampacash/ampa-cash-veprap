import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { NewWebsocketService } from "./newWebSocket.service";
import { map } from "rxjs/operators";
import { environment } from "../../environments/environment.prod";

const URL = "www.ampacash.com";

@Injectable({
  providedIn: 'root'
})
export class NewMsgService {
  public newMsgs: Subject<any>;

  constructor(wsService: NewWebsocketService, private wss: NewWebsocketService) {
    console.log("this.newMsgs: ", this.newMsgs);
    this.newMsgs = <Subject<any>>wsService.connect(URL).pipe(map(
      (response: MessageEvent): any => {
        let data = response;
        console.log(data);
        return data;
      }
    ));
  }
  disconnect() {
    this.wss.disconnect();
  }
  connect() {
    this.wss.connect(URL);
  }
}
