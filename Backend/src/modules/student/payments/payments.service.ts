import { VerifyPaymentInput, verifyPaymentSchema } from './payments.validation';
import prisma from "../../../lib/prisma"
import { isValidPaymentSignature, razorpay } from "../../../lib/razorPay";
import { BadRequestError, NotFoundError } from "../../../errors/Errors";


export const createOrderService=async(studentId:string,courseId:string)=>{
const course=await prisma.course.findFirst({
    where:{id:courseId,status:"PUBLISHED",isPublic:true},
    select:{id:true,title:true,price:true},
})
if(!course) throw new NotFoundError("Course not found or not available for enrollment");
if(course.price <= 0) throw new BadRequestError("This course is free. You can enroll without payment.")

const existing=await prisma.enrollment.findUnique({
    where:{studentId_courseId:{studentId,courseId}}
})
if(existing) throw new BadRequestError("Already enrolled in this course");

const amount=Math.round(course.price*100); 
const order=await razorpay().orders.create({
    amount,
    currency:"INR",
    receipt:`course_${courseId.slice(-10)}_${Date.now()}`,
    notes:{studentId,courseId}
})

await prisma.payment.create({
    data:{
        studentId,
        courseId,
        amount,
        currency:"INR",
        status:"CREATED",
        razorpayOrderId:order.id,
    }
})
return {
    orderId:order.id,
    amount,
    currency:"INR",
    courseTitle:course.title,  
    keyId:process.env.RAZORPAY_KEY_ID
}
}

export const fulfilPayment = async (
  paymentId: string,
  razorpayPaymentId: string,
  signature: string | null,
) => {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundError("Payment not found.");

    if (payment.status === "PAID") {
      return { enrolled: true, alreadyProcessed: true };
    }

    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "PAID", razorpayPaymentId, razorpaySignature: signature },
    });

    await tx.enrollment.upsert({
      where: {
        studentId_courseId: { studentId: payment.studentId, courseId: payment.courseId },
      },
      update: {},
      create: {
        studentId: payment.studentId,
        courseId: payment.courseId,
        status: "ACTIVE",
        progressPercentage: 0
      },
    });

    return { enrolled: true, alreadyProcessed: false };
  });
};

export const verifyPaymentService=async(studentId:string,input:VerifyPaymentInput)=>{
const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=input;
if(!isValidPaymentSignature(razorpay_order_id,razorpay_payment_id,razorpay_signature)){
    await prisma.payment.updateMany({
        where:{razorpayOrderId:razorpay_order_id,studentId},
        data:{status:"FAILED"}
    })
    throw new BadRequestError("Payment verification failed");
} 
const payment=await prisma.payment.findUnique({
    where:{razorpayOrderId:razorpay_order_id},
});
if(!payment) throw new NotFoundError("Payment record not found");
if(payment.studentId!==studentId) throw new BadRequestError("Unauthorized access to payment record");
const charged=await razorpay().payments.fetch(razorpay_payment_id);
if(charged.order_id!==razorpay_order_id) throw new BadRequestError("Invalid payment record");
if(charged.status!=="captured"){
    await prisma.payment.update({
        where:{id:payment.id},
        data:{status:"FAILED",failureReason:`Razorpay status: ${charged.status}`}
    })
     throw new BadRequestError("Payment was not completed.");
}
  if (Number(charged.amount) !== payment.amount) {
    throw new BadRequestError("Paid amount does not match the course price.");
  }
   return fulfilPayment(payment.id, razorpay_payment_id, razorpay_signature);
}