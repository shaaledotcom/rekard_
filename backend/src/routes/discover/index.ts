// Discover routes index (no auth required - public discovery)
import { Router } from 'express';
import { dashboardRoutes } from './dashboard.js';
import { discoverTicketsRoutes } from './tickets.js';
import { publicPlatformRoutes } from './platform.js';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/tickets', discoverTicketsRoutes);
router.use('/platform', publicPlatformRoutes);

export const discoverRoutes: Router = router;

