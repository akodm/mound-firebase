// 지연 함수
export const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

// 날짜 유효성 확인
export const expireValidation = () => {};

// Expire 타임스탬프를 날짜 형식으로 변경
export const parseExpireToDateAt = () => {};

// 날짜 형식을 Expire 타임스탬프로 형식으로 변경
export const parseDateToExpiresAt = () => {};
