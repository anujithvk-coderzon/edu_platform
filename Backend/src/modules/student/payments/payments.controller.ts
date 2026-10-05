import { Request, Response } from "express";
import { createOrderSchema, verifyPaymentSchema } from "./payments.validation";
import { createOrderService, verifyPaymentService } from "./payments.service";
import { AuthRequest } from "../../../middlewares/auth";


export const createOrder=async(req:AuthRequest,res:Response)=>{
    const userId=req.user?.id;
    const validated=createOrderSchema.safeParse(req.body);
    if(!validated.success) throw validated.error;
    const data=await createOrderService(userId,validated.data.courseId);
    return res.status(201).json({
        success:true,
        message:"Order created successfully",
        data
    })
}
export const verifyPayment = async (req: AuthRequest, res: Response) => {
    const userId=req.user?.id;
  const parsed = verifyPaymentSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data = await verifyPaymentService(userId, parsed.data);
  return res.json({ success: true, data });
};