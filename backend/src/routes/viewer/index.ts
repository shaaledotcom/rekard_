// Viewer routes index
import { Router } from 'express';
import { cartRoutes } from './cart.js';
import { streamingRoutes } from './streaming.js';
import { ordersRoutes } from './orders.js';
import { chatRoutes } from './chat.js';
import { geolocationMiddleware } from '../../shared/middleware/geolocation.js';

const router = Router();

router.use('/cart', cartRoutes);
router.use('/streaming', streamingRoutes);
// Apply geolocation middleware to enforce geoblocking at purchase time only
router.use('/orders', geolocationMiddleware, ordersRoutes);
router.use('/chat', chatRoutes);

export const viewerRoutes: Router = router;

