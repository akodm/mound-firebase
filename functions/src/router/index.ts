import express from "express";

const router = express.Router();

/**
 * @swagger
 * tags:
 *    name: Default
 *    description: 기본 경로 API
 */

/**
 * @swagger
 * paths:
 *  /ping:
 *    get:
 *      summary: ping
 *      tags: [Default]
 *      response:
 *        200:
 *          description: ping
 */
router.get("/ping", (req, res, next) => {
  try {
    return res.status(200).send({
      result: true,
      message: "ping",
      data: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
