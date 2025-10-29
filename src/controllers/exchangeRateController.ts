import { Request, Response } from 'express';
import { nbgService } from '../services/nbgService.js';

/**
 * Exchange Rate Controller
 * Handles API endpoints for currency exchange rates
 */

/**
 * GET /api/exchange-rates/current
 * Get current USD to GEL exchange rate
 */
export const getCurrentRate = async (req: Request, res: Response) => {
  try {
    const rate = await nbgService.getCurrentRate();

    res.json({
      success: true,
      data: {
        usdToGel: rate.usdToGel,
        gelToUsd: rate.gelToUsd,
        lastUpdated: rate.lastUpdated,
        validFrom: rate.validFrom
      }
    });
  } catch (error: any) {
    console.error('Error fetching current exchange rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exchange rate',
      error: error.message
    });
  }
};

/**
 * GET /api/exchange-rates/refresh
 * Force refresh exchange rate from NBG API
 * (Admin only - should be protected)
 */
export const refreshRate = async (req: Request, res: Response) => {
  try {
    const rate = await nbgService.refreshRate();

    res.json({
      success: true,
      message: 'Exchange rate refreshed successfully',
      data: {
        usdToGel: rate.usdToGel,
        gelToUsd: rate.gelToUsd,
        lastUpdated: rate.lastUpdated,
        validFrom: rate.validFrom,
        fetchedAt: rate.fetchedAt
      }
    });
  } catch (error: any) {
    console.error('Error refreshing exchange rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh exchange rate',
      error: error.message
    });
  }
};

/**
 * GET /api/exchange-rates/convert
 * Convert between USD and GEL
 * Query params: amount, from (USD or GEL)
 */
export const convertCurrency = async (req: Request, res: Response) => {
  try {
    const { amount, from } = req.query;

    if (!amount || !from) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: amount and from'
      });
    }

    const amountNum = parseFloat(amount as string);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    const fromCurrency = (from as string).toUpperCase();
    if (fromCurrency !== 'USD' && fromCurrency !== 'GEL') {
      return res.status(400).json({
        success: false,
        message: 'Invalid from currency. Must be USD or GEL'
      });
    }

    let convertedAmount: number;
    let toCurrency: string;

    if (fromCurrency === 'USD') {
      convertedAmount = await nbgService.convertUsdToGel(amountNum);
      toCurrency = 'GEL';
    } else {
      convertedAmount = await nbgService.convertGelToUsd(amountNum);
      toCurrency = 'USD';
    }

    const rate = await nbgService.getCurrentRate();

    return res.json({
      success: true,
      data: {
        originalAmount: amountNum,
        originalCurrency: fromCurrency,
        convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimals
        convertedCurrency: toCurrency,
        rate: fromCurrency === 'USD' ? rate.usdToGel : rate.gelToUsd,
        lastUpdated: rate.lastUpdated
      }
    });
  } catch (error: any) {
    console.error('Error converting currency:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to convert currency',
      error: error.message
    });
  }
};

/**
 * GET /api/exchange-rates/cached
 * Get cached rate (doesn't trigger fetch if expired)
 */
export const getCachedRate = async (req: Request, res: Response) => {
  try {
    const rate = nbgService.getCachedRate();

    if (!rate) {
      return res.status(404).json({
        success: false,
        message: 'No cached rate available'
      });
    }

    return res.json({
      success: true,
      data: {
        usdToGel: rate.usdToGel,
        gelToUsd: rate.gelToUsd,
        lastUpdated: rate.lastUpdated,
        validFrom: rate.validFrom,
        fetchedAt: rate.fetchedAt
      }
    });
  } catch (error: any) {
    console.error('Error getting cached rate:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get cached rate',
      error: error.message
    });
  }
};
