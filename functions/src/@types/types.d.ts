export declare namespace OpenAPITypes {
  interface LocationParams {
    accessToken: string;
    cd?: number;
  }

  interface LocationChild {
    y_coor: string;
    full_addr: string;
    x_coor: string;
    addr_name: string;
    cd: string;
  }
  
  interface LocationResult {
    id: string;
    result: LocationChild[];
  }

  interface AuthParams {
    consumer_key: string;
    consumer_secret: string;
  }

  interface AuthResult {
    id: string;
    result: {
      accessToken: string;
      accessTimeout: string;
    };
    errMsg: string;
    errCd: number;
    trId: string;
  }
}
