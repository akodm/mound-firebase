import Mail from "nodemailer/lib/mailer";

// 이메일 인증 코드 객체
export const authCodeByEmailConfig = (email: string, code: string): Mail.Options => {
  return {
    to: email,
    subject: "Mound Email Auth Code",
    html: `
      <div>
        <h1>Mound Email Auth Code</h1>
        <h2>아래의 이메일 인증 코드를 입력하여 주세요.</h2>
        <h4>${code}</h4>
        <span>이메일 인증 관련하여 문제가 지속될 경우 junandyul2023@gmail.com 으로 문의하여 주세요.</span>
      </div>
    `,
  };
};
