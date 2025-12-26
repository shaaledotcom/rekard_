// Payments routes index
import { Router } from 'express';
import { razorpayRoutes } from './razorpay.js';

const router = Router();

router.use('/razorpay', razorpayRoutes);

export const paymentsRoutes: Router = router;

