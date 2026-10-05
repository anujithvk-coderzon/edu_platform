import Razorpay from "razorpay";
import { validatePaymentVerification, validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import { InternalServerError } from "../errors/Errors";


let client:Razorpay|null =null;

export const razorpay=()=>{
    if(client) return client;
    const keyI_id=process.env.RAZORPAY_KEY_ID;
    const key_secret=process.env.RAZORPAY_KEY_SECRET;
    if(!keyI_id || !key_secret) throw new Error("Razorpay keys are not set in environment variables");
    client=new Razorpay({
        key_id:keyI_id,
        key_secret:key_secret
    });
    return client;
}

export const  isValidPaymentSignature=(orderId:string,paymentId:string,signature:string)=>{
const secret=process.env.RAZORPAY_KEY_SECRET;
if(!secret) throw new Error("Razorpay secret is not set in environment variables");
return validatePaymentVerification({
order_id:orderId,
payment_id:paymentId
},signature,secret);
}

export const isValidWebhookSignature = (
  rawBody: Buffer,
  signature: string,
): boolean => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new InternalServerError("Webhook secret is not configured.");

  return validateWebhookSignature(rawBody.toString(), signature, secret);
};