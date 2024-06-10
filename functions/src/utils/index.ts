import moment from "moment";

// 지연 함수
export const sleep = (delay: number): Promise<any> => new Promise((resolve) => setTimeout(resolve, delay));

// 날짜 유효성 확인
export const expireValidation = (
  date: string | Date,
  granularity: moment.unitOfTime.StartOf = "minutes",
  near?: number,
  nearGranularity?: moment.unitOfTime.DurationConstructor,
): boolean => {
  const parse = moment().isAfter(moment(date), granularity);

  if (near) {
    const nearDate = moment().subtract(near, nearGranularity);

    return nearDate.isAfter(moment(date), granularity);
  } else {
    return parse;
  }
};

// Expire 타임스탬프를 날짜 형식으로 변경
export const parseExpireToDateAt = (exp: number): Date => {
  return new Date(exp * 1000);
};

// 날짜 형식을 Expire 타임스탬프로 형식으로 변경
export const parseDateToExpiresAt = (date: Date): number => {
  return moment(date).unix();
};

// 현재 시각 반환
export const getNowMoment = (format: string = "YYYY-MM-DD HH:mm:ss") => {
  return moment().format(format);
};

// 랜덤 문자열 생성
export const generateRandomString = (length: number) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};
