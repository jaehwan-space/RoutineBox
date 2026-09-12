import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { errorHandler } from "./middleware/error-handler.js";
import { oauthRouter } from "./modules/auth/oauth-router.js";
import { authRouter } from "./modules/auth/router.js";
import { cartRouter } from "./modules/cart/router.js";
import { productRouter } from "./modules/product/router.js";
import { subscriptionRouter } from "./modules/subscription/router.js";
import { healthRouter } from "./routes/health.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // Nginx 뒤에서 secure 쿠키·클라이언트 IP 처리
  app.use(helmet());
  app.use(cors({ origin: config.APP_URL, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use(healthRouter);
  app.use(authRouter);
  app.use(oauthRouter);
  app.use(productRouter);
  app.use(cartRouter);
  app.use(subscriptionRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "요청한 경로가 없습니다." } });
  });
  app.use(errorHandler);
  return app;
}
