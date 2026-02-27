import { httpRouter } from "convex/server";
import { paystackWebhook } from "./webhooks/paystack";


const http = httpRouter();

http.route({
  path: "/webhooks/paystack",
  method: "POST",
  handler: paystackWebhook,
});

export default http;