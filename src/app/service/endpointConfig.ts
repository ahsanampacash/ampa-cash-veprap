import { HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment.prod';
export class EndPointConfig {
  /**
  * name
  */
  public static endpointList = [
    {
      'name': 'otpin',
      'endPoint': 'payments/otpin/submit',
      'endPointService': 'payment-service/otpin/submit',
      'type': 'POST'
    },
    
    {
      'name': 'merchant/server-config',
      'endPoint': 'merchant/server-config',
      'endPointService': 'merchant/server-config',
      'type': 'GET'
    }
  ]
  
  public static baseUrl = "www.ampacash.com";

  public static generateCompleteEndpointURL(endPoint) {
    return this.baseUrl + 'v1/web/' + endPoint;
  }

  public static generateCompleteEndpointURLNew(endPoint) {
    endPoint = endPoint.replace(EndPointConfig.baseUrl, '');
    return EndPointConfig.baseUrl + endPoint;
}
  
  public static generateRequestHeaders() {
    return new HttpHeaders({
      'platform': 'web',
      'lat': '28.457523',
      'lon': '77.026344',
      'env': 'prod',
      'Content-Type': 'application/json'
    })
  }
  public static generateServiceDetails(url) {
    var getEndPoint = EndPointConfig.endpointList.filter(function (item) { return item.name === url })[0];
    return {
      'url': this.generateCompleteEndpointURLNew(getEndPoint.endPointService),
      'type': getEndPoint.type,
      'requestHeaders': this.generateRequestHeaders(),
    }
  }
}
