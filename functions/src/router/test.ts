import express from "express";

import { sendEmail } from "../modules/nodemailer";
import { adminAuthentication } from "../utils/admin";

const router = express.Router();

// 이메일 전송 테스트
router.post("/email", adminAuthentication, async (req, res, next) => {
  try {
    const { to, subject, text } = req.body;

    await sendEmail({
      to,
      subject,
      text,
    });

    return res.status(200).send({
      result: true,
      data: null,
      message: "이메일을 전송하였습니다.",
      code: null,
    })
  } catch (err) {
    return next(err);
  }
});

export default router;
