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

  interface LocationParse {
    latitude: string;
    longitude: string;
    location: string;
    address: string;
    code: string;
  }

  interface GeocodeCoord {
    x: number | string;
    y: number | string;
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

export declare namespace TokenTypes {
  interface Payload {
    id: string;
  }

  interface Issue {
    token: string;
    expire: string;
  }

  interface JwtObject extends Payload {
    iat: number;
    exp: number;
    sub: "Access" | "Refresh";
  }
}
