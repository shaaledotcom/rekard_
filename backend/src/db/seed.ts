// Database seeding - default tenant and billing plans
import 'dotenv/config';
import { eq, and } from 'drizzle-orm';
import { db, billingPlans, tenants } from './index.js';
import { log } from '../shared/middleware/logger.js';

// System/Default tenant UUID - used for global/public resources
// This is a fixed UUID that represents the "system" or "public" tenant
export const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';
export const SYSTEM_USER_ID = 'system';
export const DEFAULT_APP_ID = 'public';

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
      { code: 'free_tickets', label: '100 Tickets Free', icon: 'sparkles', included: true },
      { code: 'premium_features', label: 'All Premium features', icon: 'shield-check', included: true },
    ],
    isActive: true,
    isPublic: true,
    sortOrder: 2,
  },
];

/**
 * Creates or gets the system tenant
 * This tenant is used for global/public resources like default billing plans
 */
export const ensureSystemTenant = async (): Promise<{ id: string; created: boolean }> => {
  // Check if system tenant exists
  const [existing] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, SYSTEM_TENANT_ID))
    .limit(1);

  if (existing) {
    return { id: existing.id, created: false };
  }

  // Create system tenant with fixed UUID
  await db.insert(tenants).values({
    id: SYSTEM_TENANT_ID,
    userId: SYSTEM_USER_ID,
    appId: DEFAULT_APP_ID,
    isPro: false,
    status: 'active',
  });

  log.info(`Created system tenant with ID: ${SYSTEM_TENANT_ID}`);
  return { id: SYSTEM_TENANT_ID, created: true };
};

/**
 * Seeds default billing plans if they don't exist
 */
export const seedDefaultPlans = async (
  appId: string = DEFAULT_APP_ID,
  tenantId: string = SYSTEM_TENANT_ID
): Promise<{ created: number; skipped: number }> => {
  // Ensure system tenant exists first (FK constraint)
  await ensureSystemTenant();

  let created = 0;
  let skipped = 0;

  for (const plan of DEFAULT_PLANS) {
    // Check if plan already exists
    const [existing] = await db
      .select()
      .from(billingPlans)
      .where(
        and(
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
    
    const tenantResult = await ensureSystemTenant();
    log.info(`System tenant: ${tenantResult.created ? 'created' : 'already exists'}`);
    
    const planResult = await seedDefaultPlans();
    log.info(`Plans seeding completed: ${planResult.created} created, ${planResult.skipped} skipped`);
    
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

export { DEFAULT_PLANS };

