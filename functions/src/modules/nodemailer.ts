import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const { NODE_ENV, GMAIL_USER, GMAIL_APP_PASS } = process.env;

// 메일 설정
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: NODE_ENV !== "development" ? 465 : 587,
  secure: NODE_ENV !== "development",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASS,
  },
});

// 메일 인스턴스
export const getTransporter = () => transporter;

// 메일 전송
export const sendEmail = (config: Mail.Options): Promise<SMTPTransport.SentMessageInfo> => {
  return new Promise((resolve: (value: SMTPTransport.SentMessageInfo) => void, reject) => {
    return getTransporter().sendMail({
      ...config,
    }, (err, info) => {
      if (err) {
        return reject(err);
      }

      return resolve(info);
    });
  });
};

export default transporter;