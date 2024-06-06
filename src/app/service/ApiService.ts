import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EndPointConfig } from './endpointConfig';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class ApiService {
  constructor(private http: HttpClient) {
  }
  initiateAPI(url: string, dataToSend: any): Observable<any> {
    var apiDetails = EndPointConfig.generateServiceDetails(url);
    //TODO : Call API here

    switch (apiDetails.type) {
      case "POST": {
        return this.http.post<any>(apiDetails.url, dataToSend, {
          headers: apiDetails.requestHeaders
        })

      }
      case "GET": {
        if (url === 'merchant/server-config') {
            url = EndPointConfig.generateCompleteEndpointURLNew(apiDetails.url + '/' + dataToSend['merchantId']);
        }
    
        return this.http.get<any>(url, {
            headers: apiDetails.requestHeaders
        });
    }
      default: {
        throw new Error("Invalid choice");
      }
    }
  }
}
