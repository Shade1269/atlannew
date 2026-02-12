import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'
// ThemeProvider removed - not needed
// PWA removed - not needed

// Suppress Chrome extension and Geidea SDK warnings - ONLY in development (Best Practice)
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  // Store original console methods globally
  if (!(window as any).__originalConsoleError) {
    (window as any).__originalConsoleError = console.error;
    (window as any).__originalConsoleWarn = console.warn;
    (window as any).__originalConsoleLog = console.log;
    (window as any).__originalConsoleInfo = console.info;
    (window as any).__originalConsoleDir = console.dir;
  }
  
  const originalError = (window as any).__originalConsoleError;
  const originalWarn = (window as any).__originalConsoleWarn;
  const originalLog = (window as any).__originalConsoleLog;
  const originalInfo = (window as any).__originalConsoleInfo;
  const originalDir = (window as any).__originalConsoleDir;
  
  // Helper to check if message should be suppressed
  const shouldSuppress = (args: any[]): boolean => {
    const fullText = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ').toLowerCase();
    
    const suppressPatterns = [
      'runtime.lasterror',
      'receiving end does not exist',
      'could not establish connection',
      'groupib',
      'group-ib',
      'x-correlation-id',
      'correlation-id',
      'geolocation',
      'permissions policy',
      'permission',
      'securityerror',
      'security error',
      'blocked a frame',
      'frame with origin',
      'refused to get unsafe header',
      'refused to get',
      'unsafe header',
      'violation',
      'build version',
      'hpp loaded current url',
      'hpp loaded',
      'environment:',
      'environment',
      'gateway url',
      'hpp url',
      'region :',
      'region:',
      'geideacheckout',
      'geideacheckouthpp',
      'geideacheckouthpp.min.js',
      'geideacheckout.min.js',
      'setting attribute',
      'setting pre authorize',
      'setting pre',
      'initializing',
      'initialization',
      'completed successfully',
      'requesting geolocation',
      'script loaded successfully',
      'checking window',
      'existence:',
      'ms_provider',
      'ordersource',
      'merchant_category_code',
      'transaction_sum',
      'transaction_currency',
      'store_name',
      'store_id',
      'cid:',
      'backurl:',
      'gafurl:',
      'test.js',
      'hpp started',
      'hpp loaded',
      'hpp loaded current url',
      'refused to get unsafe header',
      'correlation id',
      'pre authorize',
      'session id',
      'session correlation id',
    ];
    
    return suppressPatterns.some(pattern => fullText.includes(pattern));
  };
  
  // Suppress Geidea SDK logs - ONLY in development (Best Practice)
  // Don't hide real errors in production
  console.error = new Proxy(originalError, {
    apply: (target, thisArg, args) => {
      // Suppress Geidea SDK errors only in development
      const fullText = args.map(a => String(a)).join(' ').toLowerCase();
      if (fullText.includes('geidea') || fullText.includes('securityerror') || 
          fullText.includes('groupib') || fullText.includes('correlation-id') ||
          fullText.includes('refused to get unsafe header')) {
        return; // Suppress Geidea SDK errors in development
      }
      if (shouldSuppress(args)) return;
      target.apply(thisArg, args);
    }
  });
  
  console.warn = new Proxy(originalWarn, {
    apply: (target, thisArg, args) => {
      // Suppress Geidea SDK warnings only in development
      const fullText = args.map(a => String(a)).join(' ').toLowerCase();
      if (fullText.includes('geidea') || fullText.includes('violation') || 
          fullText.includes('groupib') || fullText.includes('correlation-id') ||
          fullText.includes('refused to get unsafe header') ||
          fullText.includes('permissions policy') ||
          fullText.includes('geolocation')) {
        return; // Suppress Geidea SDK warnings in development
      }
      if (shouldSuppress(args)) return;
      target.apply(thisArg, args);
    }
  });
  
  console.log = new Proxy(originalLog, {
    apply: (target, thisArg, args) => {
      // Suppress verbose Geidea SDK logs only in development
      const fullText = args.map(a => String(a)).join(' ').toLowerCase();
      if (fullText.includes('geidea') || fullText.includes('groupib') || 
          fullText.includes('environment') || fullText.includes('gateway url') ||
          fullText.includes('hpp url') || fullText.includes('region :') ||
          fullText.includes('region:') ||
          fullText.includes('build version') ||
          fullText.includes('script loaded successfully') ||
          fullText.includes('checking window') ||
          fullText.includes('initializing') ||
          fullText.includes('setting attribute') ||
          fullText.includes('setting pre authorize') ||
          fullText.includes('completed successfully') ||
          fullText.includes('requesting geolocation')) {
        return; // Suppress verbose Geidea SDK logs in development
      }
      if (shouldSuppress(args)) return;
      target.apply(thisArg, args);
    }
  });
  
  console.info = new Proxy(originalInfo, {
    apply: (target, thisArg, args) => {
      // Suppress Geidea SDK info logs only in development
      const fullText = args.map(a => String(a)).join(' ').toLowerCase();
      if (fullText.includes('geidea') || fullText.includes('groupib')) {
        return; // Suppress Geidea SDK info logs in development
      }
      if (shouldSuppress(args)) return;
      target.apply(thisArg, args);
    }
  });
  
  console.dir = new Proxy(originalDir, {
    apply: (target, thisArg, args) => {
      if (shouldSuppress(args)) return;
      target.apply(thisArg, args);
    }
  });
  
  // Also suppress window.onerror for Geidea SDK errors (development only)
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const errorMessage = String(message || '').toLowerCase();
    const errorSource = String(source || '').toLowerCase();
    
    // Suppress SecurityError and other non-critical errors from Geidea SDK (development only)
    if ((errorMessage.includes('securityerror') || 
         errorMessage.includes('refused to get unsafe header') ||
         errorMessage.includes('correlation-id')) && 
        (errorSource.includes('geidea') || errorSource.includes('ksamerchant'))) {
      return true; // Suppress error in development
    }
    
    if (originalOnError) {
      return originalOnError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };
  
  // Also suppress unhandled promise rejections from Geidea SDK (development only)
  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    const errorMessage = String(event.reason || '').toLowerCase();
    const errorStack = String(event.reason?.stack || '').toLowerCase();
    
    // Suppress Geidea SDK promise rejections (development only)
    if (errorMessage.includes('geidea') || errorMessage.includes('ksamerchant') ||
        errorStack.includes('geidea') || errorStack.includes('ksamerchant')) {
      event.preventDefault(); // Suppress error in development
      return;
    }
    
    if (originalOnUnhandledRejection) {
      originalOnUnhandledRejection.call(window, event);
    }
  };
  
  // Mark as globally suppressed (development only)
  (window as any).__geideaConsoleSuppressed = true;
}

// PWA removed - not needed

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
