// Viewer routes index
import { Router } from 'express';
import { cartRoutes } from './cart.js';
import { streamingRoutes } from './streaming.js';
import { ordersRoutes } from './orders.js';
import { chatRoutes } from './chat.js';

const router = Router();

router.use('/cart', cartRoutes);
router.use('/streaming', streamingRoutes);
router.use('/orders', ordersRoutes);
router.use('/chat', chatRoutes);

export const viewerRoutes: Router = router;

