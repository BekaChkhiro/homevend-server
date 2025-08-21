/**
 * Utility functions for querying transaction history with detailed filtering
 */

import { Repository, SelectQueryBuilder } from 'typeorm';
import { Transaction, TransactionTypeEnum } from '../models/Transaction.js';

export interface TransactionFilter {
  userId?: number;
  propertyId?: number;
  purchaseType?: 'vip_only' | 'services_only' | 'vip_and_services';
  serviceType?: string;
  transactionType?: TransactionTypeEnum;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  vipPurchases: number;
  servicePurchases: number;
  mostUsedService?: string;
}

/**
 * Builds a query for filtering transactions with detailed metadata search
 */
export function buildTransactionQuery(
  repository: Repository<Transaction>,
  filter: TransactionFilter
): SelectQueryBuilder<Transaction> {
  let query = repository.createQueryBuilder('transaction')
    .leftJoinAndSelect('transaction.user', 'user')
    .orderBy('transaction.createdAt', 'DESC');

  if (filter.userId) {
    query = query.andWhere('transaction.userId = :userId', { userId: filter.userId });
  }

  if (filter.propertyId) {
    query = query.andWhere("transaction.metadata->>'propertyId' = :propertyId", { 
      propertyId: filter.propertyId.toString() 
    });
  }

  if (filter.purchaseType) {
    query = query.andWhere("transaction.metadata->>'purchaseType' = :purchaseType", { 
      purchaseType: filter.purchaseType 
    });
  }

  if (filter.serviceType) {
    query = query.andWhere(`(
      transaction.metadata->'vipService'->>'serviceType' = :serviceType OR
      EXISTS (
        SELECT 1 FROM jsonb_array_elements(transaction.metadata->'additionalServices') AS service
        WHERE service->>'serviceType' = :serviceType
      )
    )`, { serviceType: filter.serviceType });
  }

  if (filter.transactionType) {
    query = query.andWhere('transaction.type = :transactionType', { 
      transactionType: filter.transactionType 
    });
  }

  if (filter.dateFrom) {
    query = query.andWhere('transaction.createdAt >= :dateFrom', { dateFrom: filter.dateFrom });
  }

  if (filter.dateTo) {
    query = query.andWhere('transaction.createdAt <= :dateTo', { dateTo: filter.dateTo });
  }

  if (filter.limit) {
    query = query.limit(filter.limit);
  }

  if (filter.offset) {
    query = query.offset(filter.offset);
  }

  return query;
}

/**
 * Gets transaction summary statistics
 */
export async function getTransactionSummary(
  repository: Repository<Transaction>,
  filter: Omit<TransactionFilter, 'limit' | 'offset'>
): Promise<TransactionSummary> {
  const baseQuery = buildTransactionQuery(repository, filter);
  
  // Get basic counts and totals
  const transactions = await baseQuery.getMany();
  
  const summary: TransactionSummary = {
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
    vipPurchases: transactions.filter(t => t.type === TransactionTypeEnum.VIP_PURCHASE).length,
    servicePurchases: transactions.filter(t => t.type === TransactionTypeEnum.SERVICE_PURCHASE).length
  };

  // Find most used service
  const serviceCounts: Record<string, number> = {};
  
  transactions.forEach(transaction => {
    const metadata = transaction.metadata as any;
    if (metadata?.vipService?.serviceType) {
      serviceCounts[metadata.vipService.serviceType] = (serviceCounts[metadata.vipService.serviceType] || 0) + 1;
    }
    
    if (metadata?.additionalServices) {
      metadata.additionalServices.forEach((service: any) => {
        if (service.serviceType) {
          serviceCounts[service.serviceType] = (serviceCounts[service.serviceType] || 0) + 1;
        }
      });
    }
  });

  if (Object.keys(serviceCounts).length > 0) {
    summary.mostUsedService = Object.entries(serviceCounts)
      .sort(([, a], [, b]) => b - a)[0][0];
  }

  return summary;
}

/**
 * Gets detailed transaction history with formatted metadata
 */
export async function getDetailedTransactionHistory(
  repository: Repository<Transaction>,
  filter: TransactionFilter
) {
  const query = buildTransactionQuery(repository, filter);
  const transactions = await query.getMany();

  return transactions.map(transaction => ({
    id: transaction.id,
    uuid: transaction.uuid,
    type: transaction.type,
    status: transaction.status,
    amount: Number(transaction.amount),
    description: transaction.description,
    createdAt: transaction.createdAt,
    metadata: transaction.metadata,
    // Parsed metadata for easier access
    parsedDetails: parseTransactionDetails(transaction.metadata),
    user: transaction.user ? {
      id: transaction.user.id,
      fullName: transaction.user.fullName,
      email: transaction.user.email
    } : null
  }));
}

/**
 * Parses transaction metadata into a more readable format
 */
function parseTransactionDetails(metadata: any) {
  if (!metadata) return null;

  const details: any = {
    propertyId: metadata.propertyId,
    propertyTitle: metadata.propertyTitle,
    purchaseType: metadata.purchaseType,
    totalCost: metadata.costBreakdown?.totalCost || 0
  };

  // Parse VIP service details
  if (metadata.vipService) {
    details.vipService = {
      type: metadata.vipService.serviceType,
      days: metadata.vipService.days,
      cost: metadata.vipService.totalCost,
      expiresAt: metadata.vipService.expiresAt
    };
  }

  // Parse additional services
  if (metadata.additionalServices && metadata.additionalServices.length > 0) {
    details.additionalServices = metadata.additionalServices.map((service: any) => ({
      type: service.serviceType,
      days: service.days,
      cost: service.totalCost,
      expiresAt: service.expiresAt,
      autoRenewEnabled: service.autoRenewEnabled || false
    }));
  }

  return details;
}