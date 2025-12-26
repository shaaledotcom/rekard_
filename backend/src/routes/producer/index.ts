// Producer routes index
import { Router } from 'express';
import { eventsRoutes } from './events.js';
import { ticketsRoutes } from './tickets.js';
import { ordersRoutes } from './orders.js';
import { currencyRoutes } from './currency.js';
import { platformRoutes } from './platform.js';
import { configurationRoutes } from './configuration.js';
import { billingRoutes } from './billing.js';
import { viewersRoutes } from './viewers.js';

const router = Router();

router.use('/events', eventsRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/orders', ordersRoutes);
router.use('/currencies', currencyRoutes);
router.use('/platform', platformRoutes);
router.use('/configuration', configurationRoutes);
router.use('/billing', billingRoutes);
router.use('/viewers', viewersRoutes);

export const producerRoutes: Router = router;

