// Database seeding - default billing plans
import 'dotenv/config';
import { eq, and } from 'drizzle-orm';
import { db, billingPlans } from './index.js';
import { log } from '../shared/middleware/logger.js';

// Default app/tenant for global plans (must match tenant middleware defaults)
const DEFAULT_APP_ID = 'public';
const DEFAULT_TENANT_ID = 'public';

// Default billing plans
const DEFAULT_PLANS = [
  {
    name: 'Premium',
    description: 'All features + Rekard Infra',
    price: 10000,
    currency: 'INR',
    billingCycle: 'yearly',
    initialTickets: 50,
    features: [
      { code: 'sell_tickets', label: 'Sell tickets', icon: 'ticket', included: true },
      { code: 'rekard_payments', label: 'Rekard Payment Gateways', icon: 'credit-card', included: true },
      { code: 'livestream_vod', label: 'Livestream & Video On Demand', icon: 'video', included: true },
      { code: 'free_tickets', label: '50 Tickets Free', icon: 'sparkles', included: true },
      { code: 'rekard_infra', label: 'Rekard Infra', icon: 'shield-check', included: true },
    ],
    isActive: true,
    isPublic: true,
    sortOrder: 1,
  },
  {
    name: 'Pro',
    description: 'Full white-labeled experience',
    price: 25000,
    currency: 'INR',
    billingCycle: 'yearly',
    initialTickets: 100,
    features: [
      { code: 'whitelabel', label: 'Full white-labeled', icon: 'crown', included: true },
      { code: 'custom_domain', label: 'Custom Domain', icon: 'globe', included: true },
      { code: 'custom_payments', label: 'Your Payment Gateway', icon: 'credit-card', included: true },
      { code: 'whitelabel_comms', label: 'Whitelabeled Email / SMS', icon: 'mail', included: true },
      { code: 'free_tickets', label: '100 Tickets Free', icon: 'sparkles', included: true },
      { code: 'premium_features', label: 'All Premium features', icon: 'shield-check', included: true },
    ],
    isActive: true,
    isPublic: true,
    sortOrder: 2,
  },
];

/**
 * Seeds default billing plans if they don't exist
 */
export const seedDefaultPlans = async (
  appId: string = DEFAULT_APP_ID,
  tenantId: string = DEFAULT_TENANT_ID
): Promise<{ created: number; skipped: number }> => {
  let created = 0;
  let skipped = 0;

  for (const plan of DEFAULT_PLANS) {
    // Check if plan already exists
    const [existing] = await db
      .select()
      .from(billingPlans)
      .where(
        and(
          eq(billingPlans.appId, appId),
          eq(billingPlans.tenantId, tenantId),
          eq(billingPlans.name, plan.name)
        )
      )
      .limit(1);

    if (existing) {
      log.info(`Plan "${plan.name}" already exists, skipping`);
      skipped++;
      continue;
    }

    // Create the plan
    await db.insert(billingPlans).values({
      appId,
      tenantId,
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      initialTickets: plan.initialTickets,
      features: plan.features,
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      sortOrder: plan.sortOrder,
    });

    log.info(`Created plan "${plan.name}" with ${plan.initialTickets} initial tickets`);
    created++;
  }

  return { created, skipped };
};

/**
 * Run seeding as standalone script
 */
const runSeed = async (): Promise<void> => {
  try {
    log.info('Starting database seeding...');
    
    const result = await seedDefaultPlans();
    
    log.info(`Seeding completed: ${result.created} created, ${result.skipped} skipped`);
    process.exit(0);
  } catch (error) {
    log.error('Seeding failed', error);
    process.exit(1);
  }
};

// Run if executed directly
const isMainModule = process.argv[1]?.includes('seed');
if (isMainModule) {
  runSeed();
}

export { DEFAULT_PLANS, DEFAULT_APP_ID, DEFAULT_TENANT_ID };

