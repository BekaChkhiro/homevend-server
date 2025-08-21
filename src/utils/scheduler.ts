/**
 * Task scheduler for automated services
 * Handles cron jobs for auto-renewal and other scheduled tasks
 */

import cron from 'node-cron';
import { processAutoRenewals, expireAutoRenewals, getAutoRenewalStats } from './autoRenewal.js';
import { expireServices, getExpiredServiceStats } from './serviceExpiration.js';

/**
 * Initialize all scheduled tasks
 */
export function initializeScheduler(): void {
  console.log('🕐 Initializing task scheduler...');

  // Auto-renewal task - runs daily at midnight
  // Cron expression: "0 0 * * *" = every day at 00:00
  cron.schedule('0 0 * * *', async () => {
    console.log('🌙 Running daily auto-renewal task at midnight');
    
    try {
      // First, process renewals for active services
      await processAutoRenewals();
      
      // Then, disable expired services
      await expireAutoRenewals();
      
      // Also handle other service expirations (color separation, VIP, etc.)
      await expireServices();
      
      // Log stats
      const autoRenewalStats = await getAutoRenewalStats();
      const serviceStats = await getExpiredServiceStats();
      
      console.log(`📊 Daily Task Summary:
        Auto-renewal: ${autoRenewalStats.activeCount} active, ${autoRenewalStats.expiredCount} expired
        Expired services: ${serviceStats.expiredVip} VIP, ${serviceStats.expiredColorSeparation} color separation
        Total properties with expired services: ${serviceStats.totalExpired}`);
      
    } catch (error) {
      console.error('❌ Error in daily auto-renewal task:', error);
    }
  }, {
    name: 'daily-auto-renewal',
    timezone: 'Asia/Tbilisi' // Georgia timezone
  });

  // Service expiration check - runs every 6 hours for additional safety
  // Cron expression: "0 */6 * * *" = every 6 hours at minute 0
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔄 Running 6-hourly service expiration check');
    
    try {
      await expireServices();
      await expireAutoRenewals();
    } catch (error) {
      console.error('❌ Error in service expiration check:', error);
    }
  }, {
    name: 'service-expiration-check',
    timezone: 'Asia/Tbilisi'
  });

  // Stats logging - runs daily at 9 AM
  // Cron expression: "0 9 * * *" = every day at 09:00
  cron.schedule('0 9 * * *', async () => {
    console.log('📈 Running daily stats report');
    
    try {
      const autoRenewalStats = await getAutoRenewalStats();
      const serviceStats = await getExpiredServiceStats();
      
      console.log(`📊 Daily Service Report:
        Auto-renewal services: ${autoRenewalStats.activeCount} active, ${autoRenewalStats.expiredCount} expired, ${autoRenewalStats.totalCount} total
        Expired VIP statuses: ${serviceStats.expiredVip}
        Expired color separation: ${serviceStats.expiredColorSeparation}
        Expired auto-renewals: ${serviceStats.expiredAutoRenew}
        Total expired services requiring attention: ${serviceStats.totalExpired}`);
    } catch (error) {
      console.error('❌ Error in daily stats report:', error);
    }
  }, {
    name: 'daily-stats',
    timezone: 'Asia/Tbilisi'
  });

  console.log('✅ Task scheduler initialized with the following jobs:');
  console.log('  - Daily auto-renewal: 00:00 (midnight)');
  console.log('  - Service expiration check: Every 6 hours');
  console.log('  - Daily stats report: 09:00 (9 AM)');
  console.log('  - Timezone: Asia/Tbilisi (Georgia)');
}

/**
 * Get status of all scheduled tasks
 */
export function getSchedulerStatus(): { name: string; running: boolean }[] {
  const tasks = cron.getTasks();
  const status: { name: string; running: boolean }[] = [];
  
  for (const [name, task] of tasks) {
    status.push({
      name: name || 'unnamed',
      running: task.getStatus() === 'scheduled'
    });
  }
  
  return status;
}

/**
 * Stop all scheduled tasks
 */
export function stopScheduler(): void {
  console.log('🛑 Stopping all scheduled tasks...');
  
  const tasks = cron.getTasks();
  for (const [name, task] of tasks) {
    task.stop();
    console.log(`  - Stopped task: ${name || 'unnamed'}`);
  }
  
  console.log('✅ All scheduled tasks stopped');
}

/**
 * Start all scheduled tasks
 */
export function startScheduler(): void {
  console.log('▶️ Starting all scheduled tasks...');
  
  const tasks = cron.getTasks();
  for (const [name, task] of tasks) {
    task.start();
    console.log(`  - Started task: ${name || 'unnamed'}`);
  }
  
  console.log('✅ All scheduled tasks started');
}