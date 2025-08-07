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
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|SCRIPT)\b)/gi,
    /(--|\||;|\/\*|\*\/|xp_|sp_|0x)/gi,
    /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
    /(\bAND\b\s*\d+\s*=\s*\d+)/gi
  ];
  
  const checkForSQLInjection = (value: any): boolean => {
    if (typeof value !== 'string') return false;
    return sqlPatterns.some(pattern => pattern.test(value));
  };
  
  const checkObject = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object') return false;
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'string' && checkForSQLInjection(value)) {
          return true;
        } else if (typeof value === 'object') {
          if (checkObject(value)) return true;
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
  const queryValues = Object.values(req.query || {});
  const paramValues = Object.values(req.params || {});
  
  for (const value of [...queryValues, ...paramValues]) {
    if (typeof value === 'string' && checkForSQLInjection(value)) {
      res.status(400).json({
        success: false,
        message: 'Invalid input detected'
      });
      return;
    }
  }
  
  next();
};