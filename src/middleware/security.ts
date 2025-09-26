import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      if (typeof obj === 'string') {
        return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitize(obj[key]);
      }
    }
    return sanitized;
  };
  
  // Only sanitize body since query and params are read-only in Express 5
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  next();
};

export const preventSQLInjection = (req: Request, res: Response, next: NextFunction): void => {
  // Content fields that should be excluded from SQL injection checking
  const contentFields = ['content', 'contentKa', 'contentEn', 'contentRu', 'description', 'text', 'body', 'message'];

  // More specific SQL injection patterns to avoid false positives
  const sqlPatterns = [
    // Classic SQL injection patterns with context
    /(^|\s)(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\s+.*(FROM|INTO|SET|WHERE|VALUES)/gi,
    // SQL comments and terminators
    /(--\s|\/\*|\*\/|;$|\|\|)/g,
    // SQL system procedures
    /(xp_|sp_cmdshell|master\.|information_schema\.)/gi,
    // Boolean-based injection patterns
    /(\bOR\b\s+\d+\s*=\s*\d+|\bAND\b\s+\d+\s*=\s*\d+)/gi,
    // UNION-based injection
    /UNION(\s+ALL)?\s+SELECT/gi
  ];

  const checkForSQLInjection = (value: any, fieldName?: string): boolean => {
    if (typeof value !== 'string') return false;

    // Skip content fields to avoid false positives
    if (fieldName && contentFields.some(field => fieldName.toLowerCase().includes(field))) {
      return false;
    }

    return sqlPatterns.some(pattern => pattern.test(value));
  };

  const checkObject = (obj: any, parentKey?: string): boolean => {
    if (!obj || typeof obj !== 'object') return false;

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const fullKey = parentKey ? `${parentKey}.${key}` : key;

        if (typeof value === 'string' && checkForSQLInjection(value, fullKey)) {
          return true;
        } else if (typeof value === 'object') {
          if (checkObject(value, fullKey)) return true;
        }
      }
    }
    return false;
  };

  // Check all request data for SQL injection patterns
  if (checkObject(req.body)) {
    res.status(400).json({
      success: false,
      message: 'Invalid input detected'
    });
    return;
  }

  // Check query and params without modifying them
  const queryValues = Object.entries(req.query || {});
  const paramValues = Object.entries(req.params || {});

  for (const [key, value] of [...queryValues, ...paramValues]) {
    if (typeof value === 'string' && checkForSQLInjection(value, key)) {
      res.status(400).json({
        success: false,
        message: 'Invalid input detected'
      });
      return;
    }
  }

  next();
};