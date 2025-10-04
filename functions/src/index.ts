/**
 * Firebase Functions for Klycs Application
 * Includes backup automation, security monitoring, and data management
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest, onSchedule} from "firebase-functions/v2/https";
import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Global configuration
setGlobalOptions({ 
  maxInstances: 10,
  region: 'us-central1'
});

// === BACKUP AUTOMATION ===

/**
 * Scheduled backup of Firestore data
 * Runs daily at 2 AM UTC
 */
export const dailyBackup = onSchedule({
  schedule: "0 2 * * *",
  timeZone: "UTC",
  memory: "1GiB",
  timeoutSeconds: 540
}, async (event) => {
  try {
    logger.info("Starting daily backup", { timestamp: new Date().toISOString() });
    
    const bucketName = `${process.env.GCLOUD_PROJECT}-backups`;
    const timestamp = new Date().toISOString().split('T')[0];
    const outputUriPrefix = `gs://${bucketName}/firestore-backups/${timestamp}`;
    
    // Export all collections
    const operation = await db.runFirestoreExport({
      databaseId: '(default)',
      outputUriPrefix,
      collectionIds: ['users', 'cards', 'bookings', 'services', 'analytics']
    });
    
    logger.info("Backup operation started", { 
      operationName: operation[0].name,
      outputUri: outputUriPrefix 
    });
    
    // Store backup metadata
    await db.collection('backups').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      outputUri: outputUriPrefix,
      operationName: operation[0].name,
      status: 'running',
      collections: ['users', 'cards', 'bookings', 'services', 'analytics']
    });
    
    return { success: true, outputUri: outputUriPrefix };
    
  } catch (error) {
    logger.error("Daily backup failed", error);
    
    // Send alert
    await sendBackupAlert({
      type: 'backup_failed',
      message: 'Daily Firestore backup failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
});

/**
 * Clean old backups (keep last 30 days)
 * Runs weekly on Sundays at 3 AM UTC
 */
export const cleanOldBackups = onSchedule({
  schedule: "0 3 * * 0",
  timeZone: "UTC"
}, async (event) => {
  try {
    logger.info("Starting backup cleanup");
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Query old backups
    const oldBackupsQuery = await db.collection('backups')
      .where('timestamp', '<', thirtyDaysAgo)
      .get();
    
    const batch = db.batch();
    let deletedCount = 0;
    
    for (const doc of oldBackupsQuery.docs) {
      const backupData = doc.data();
      
      try {
        // Delete backup files from Storage
        const bucketName = `${process.env.GCLOUD_PROJECT}-backups`;
        const bucket = storage.bucket(bucketName);
        const prefix = backupData.outputUri.replace(`gs://${bucketName}/`, '');
        
        const [files] = await bucket.getFiles({ prefix });
        await Promise.all(files.map(file => file.delete()));
        
        // Delete backup record
        batch.delete(doc.ref);
        deletedCount++;
        
      } catch (error) {
        logger.error("Failed to delete backup", { 
          backupId: doc.id, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    await batch.commit();
    
    logger.info("Backup cleanup completed", { deletedCount });
    return { success: true, deletedCount };
    
  } catch (error) {
    logger.error("Backup cleanup failed", error);
    throw error;
  }
});

// === SECURITY MONITORING ===

/**
 * Monitor suspicious activity
 */
export const monitorSuspiciousActivity = onDocumentCreated(
  "analytics/{eventId}",
  async (event) => {
    try {
      const eventData = event.data?.data();
      if (!eventData) return;
      
      const { eventType, userId, ip, userAgent, timestamp } = eventData;
      
      // Check for suspicious patterns
      if (eventType === 'login_failed') {
        await checkFailedLogins(userId, ip);
      }
      
      if (eventType === 'card_created') {
        await checkRapidCardCreation(userId);
      }
      
      if (eventType === 'file_upload') {
        await checkSuspiciousUploads(userId, eventData);
      }
      
    } catch (error) {
      logger.error("Security monitoring failed", error);
    }
  }
);

/**
 * Rate limiting enforcement
 */
export const rateLimitEnforcement = onRequest({
  cors: true,
  maxInstances: 5
}, async (req, res) => {
  try {
    const { action, userId, ip } = req.body;
    
    if (!action || !ip) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const rateLimitKey = `${action}:${userId || ip}`;
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    
    // Get current rate limit data
    const rateLimitDoc = await db.collection('rateLimits').doc(rateLimitKey).get();
    const rateLimitData = rateLimitDoc.exists ? rateLimitDoc.data() : null;
    
    // Define limits per action
    const limits: Record<string, number> = {
      'card_create': 5,
      'file_upload': 20,
      'login_attempt': 10,
      'api_call': 100
    };
    
    const limit = limits[action] || 50;
    
    if (rateLimitData) {
      const { count, windowStart } = rateLimitData;
      
      if (now - windowStart < windowMs) {
        if (count >= limit) {
          // Rate limit exceeded
          await sendSecurityAlert({
            type: 'rate_limit_exceeded',
            userId,
            ip,
            action,
            count,
            limit,
            timestamp: new Date().toISOString()
          });
          
          return res.status(429).json({ 
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((windowStart + windowMs - now) / 1000)
          });
        }
        
        // Increment counter
        await db.collection('rateLimits').doc(rateLimitKey).update({
          count: count + 1
        });
      } else {
        // Reset window
        await db.collection('rateLimits').doc(rateLimitKey).set({
          count: 1,
          windowStart: now,
          action,
          userId,
          ip
        });
      }
    } else {
      // Create new rate limit entry
      await db.collection('rateLimits').doc(rateLimitKey).set({
        count: 1,
        windowStart: now,
        action,
        userId,
        ip
      });
    }
    
    return res.json({ allowed: true, remaining: limit - (rateLimitData?.count || 0) });
    
  } catch (error) {
    logger.error("Rate limiting failed", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// === HELPER FUNCTIONS ===

async function checkFailedLogins(userId: string, ip: string) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const failedLoginsQuery = await db.collection('analytics')
    .where('eventType', '==', 'login_failed')
    .where('ip', '==', ip)
    .where('timestamp', '>=', fiveMinutesAgo)
    .get();
  
  if (failedLoginsQuery.size >= 5) {
    await sendSecurityAlert({
      type: 'brute_force_attack',
      ip,
      userId,
      attempts: failedLoginsQuery.size,
      timeWindow: '5 minutes',
      timestamp: new Date().toISOString()
    });
  }
}

async function checkRapidCardCreation(userId: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const cardsQuery = await db.collection('cards')
    .where('userId', '==', userId)
    .where('createdAt', '>=', oneHourAgo)
    .get();
  
  if (cardsQuery.size > 10) {
    await sendSecurityAlert({
      type: 'rapid_card_creation',
      userId,
      cardCount: cardsQuery.size,
      timeWindow: '1 hour',
      timestamp: new Date().toISOString()
    });
  }
}

async function checkSuspiciousUploads(userId: string, eventData: any) {
  const { fileSize, fileType, fileName } = eventData;
  
  // Check for suspicious file patterns
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|scr|pif|vbs|js)$/i,
    /^\.htaccess$/i,
    /php|asp|jsp/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(fileName) || pattern.test(fileType)
  );
  
  if (isSuspicious || fileSize > 50 * 1024 * 1024) { // 50MB
    await sendSecurityAlert({
      type: 'suspicious_upload',
      userId,
      fileName,
      fileType,
      fileSize,
      timestamp: new Date().toISOString()
    });
  }
}

async function sendSecurityAlert(alert: any) {
  try {
    // Store alert in database
    await db.collection('securityAlerts').add({
      ...alert,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'new'
    });
    
    // Send to external monitoring (webhook)
    const webhookUrl = process.env.SECURITY_WEBHOOK_URL;
    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Security Alert: ${alert.type}`,
          attachments: [{
            color: 'danger',
            fields: Object.entries(alert).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true
            }))
          }]
        })
      });
      
      if (!response.ok) {
        logger.error("Failed to send webhook alert", { status: response.status });
      }
    }
    
    logger.warn("Security alert sent", alert);
    
  } catch (error) {
    logger.error("Failed to send security alert", error);
  }
}

async function sendBackupAlert(alert: any) {
  try {
    // Store backup alert
    await db.collection('backupAlerts').add({
      ...alert,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    logger.error("Backup alert", alert);
    
  } catch (error) {
    logger.error("Failed to send backup alert", error);
  }
}

// === HEALTH CHECK ===

export const healthCheck = onRequest(async (req, res) => {
  try {
    // Check Firestore connection
    await db.collection('health').doc('check').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        firestore: 'ok',
        functions: 'ok'
      }
    });
    
  } catch (error) {
    logger.error("Health check failed", error);
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// === SUBSCRIPTION MANAGEMENT ===

/**
 * Auto-renew FREE subscriptions
 * Cron job: Daily at 00:00 UTC
 */
export { renewFreeSubscriptions, renewFreeSubscriptionsManual } from './renewFreeSubscriptions';

/**
 * Send welcome email when subscription is created
 * Trigger: onCreate user_subscriptions
 */
export { sendWelcomeEmail } from './sendWelcomeEmail';
