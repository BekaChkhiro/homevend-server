import FlittVerificationService from './FlittVerificationService.js';

export class FlittScheduler {
  private verificationService: FlittVerificationService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.verificationService = new FlittVerificationService();
  }

  /**
   * Start the automated verification scheduler
   */
  start(intervalMinutes: number = 2): void {
    if (this.isRunning) {
      console.log('⏰ Flitt scheduler is already running');
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;
    console.log(`⏰ Starting Flitt verification scheduler (every ${intervalMinutes} minutes)`);

    // Run immediately on start
    this.runVerification();

    // Set up recurring interval
    this.intervalId = setInterval(() => {
      this.runVerification();
    }, intervalMs);

    this.isRunning = true;
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏰ Flitt verification scheduler stopped');
  }

  /**
   * Run verification manually
   */
  async runNow(): Promise<any> {
    console.log('🔄 Manual Flitt verification triggered');
    return await this.runVerification();
  }

  /**
   * Internal verification runner
   */
  private async runVerification(): Promise<any> {
    try {
      console.log('🔄 Running automated Flitt verification...');
      const results = await this.verificationService.verifyAllPendingTransactions();

      const summary = {
        timestamp: new Date().toISOString(),
        total: results.length,
        completed: results.filter(r => r.status === 'completed').length,
        failed: results.filter(r => r.status === 'failed').length,
        pending: results.filter(r => r.status === 'pending').length,
        errors: results.filter(r => r.status === 'error').length
      };

      if (summary.completed > 0) {
        console.log(`✅ Flitt verification completed ${summary.completed} payments automatically`);
      }

      if (summary.failed > 0) {
        console.log(`❌ Flitt verification found ${summary.failed} failed payments`);
      }

      if (summary.errors > 0) {
        console.log(`⚠️ Flitt verification had ${summary.errors} errors`);
      }

      return { summary, results };
    } catch (error: any) {
      console.error('❌ Flitt verification scheduler error:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; intervalId: number | null } {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId ? parseInt(this.intervalId.toString()) : null
    };
  }
}

// Create singleton instance
export const flittScheduler = new FlittScheduler();

export default flittScheduler;