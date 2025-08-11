import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/utils/logger';

export interface SecurityLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'system' | 'network' | 'user_activity';
  event: string;
  description: string;
  userId?: string;
  sessionId?: string;
  ip: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  payload?: any;
  metadata: Record<string, any>;
  correlationId?: string;
  source: 'frontend' | 'backend' | 'database' | 'external';
}

export interface SecurityAlert {
  id: string;
  type: 'threshold_exceeded' | 'anomaly_detected' | 'failed_login_attempts' | 'privilege_escalation' | 'data_breach' | 'system_compromise';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  triggeredAt: Date;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  affectedUsers?: string[];
  affectedSystems?: string[];
  metrics: {
    eventCount: number;
    timeWindow: number; // minutos
    threshold: number;
  };
  actions: Array<{
    type: 'notify' | 'block' | 'quarantine' | 'investigate';
    status: 'pending' | 'completed' | 'failed';
    timestamp: Date;
    details?: string;
  }>;
  assignedTo?: string;
  resolvedAt?: Date;
  resolution?: string;
  metadata: Record<string, any>;
}

export interface MonitoringRule {
  id: string;
  name: string;
  description: string;
  category: SecurityLog['category'];
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'regex';
    value: any;
  }>;
  thresholds: {
    eventCount: number;
    timeWindow: number; // minutos
    severity: SecurityAlert['severity'];
  };
  actions: Array<{
    type: 'notify' | 'block_ip' | 'disable_user' | 'escalate';
    config: Record<string, any>;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemMetrics {
  id: string;
  timestamp: Date;
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    inbound: number;
    outbound: number;
    connections: number;
  };
  database: {
    connections: number;
    responseTime: number;
    errorRate: number;
  };
  application: {
    requestCount: number;
    errorCount: number;
    responseTime: number;
    activeUsers: number;
  };
  security: {
    failedLogins: number;
    blockedIPs: number;
    suspiciousActivities: number;
  };
}

class SecurityMonitoringService {
  private alertListeners = new Map<string, () => void>();
  private metricsBuffer: SecurityLog[] = [];
  private batchSize = 100;
  private flushInterval = 5000; // 5 segundos

  constructor() {
    // Iniciar flush periódico de logs
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  /**
   * Registrar evento de seguridad
   */
  async logSecurityEvent(logData: Omit<SecurityLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const log: Omit<SecurityLog, 'id'> = {
        ...logData,
        timestamp: new Date()
      };

      // Añadir al buffer para procesamiento en lote
      this.metricsBuffer.push({ id: '', ...log });

      // Si es crítico, procesar inmediatamente
      if (logData.level === 'critical') {
        await this.processLogImmediate(log);
      }

      // Verificar reglas de monitoreo
      await this.checkMonitoringRules(log);

    } catch (error) {
      logger.error('Error logging security event', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Procesar log inmediatamente (para eventos críticos)
   */
  private async processLogImmediate(log: Omit<SecurityLog, 'id'>): Promise<void> {
    try {
      const docRef = doc(collection(db, 'security_logs'));
      await setDoc(docRef, log);

      // Log también en el sistema principal
      logger.error('CRITICAL SECURITY EVENT', {
        event: log.event,
        description: log.description,
        userId: log.userId,
        ip: log.ip,
        metadata: log.metadata
      });

      // Disparar alerta inmediata
      await this.triggerAlert({
        type: 'system_compromise',
        severity: 'critical',
        title: 'Evento Crítico de Seguridad',
        description: log.description,
        metrics: {
          eventCount: 1,
          timeWindow: 0,
          threshold: 1
        },
        actions: [{
          type: 'notify',
          status: 'pending',
          timestamp: new Date()
        }],
        metadata: { 
          logId: docRef.id,
          event: log.event,
          ip: log.ip
        }
      });

    } catch (error) {
      logger.error('Error processing immediate log', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Flush logs del buffer a Firestore
   */
  private async flushLogs(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const logsToFlush = this.metricsBuffer.splice(0, this.batchSize);
      
      // Procesar en paralelo (pero limitado para no sobrecargar)
      const batchPromises = logsToFlush.map(async (log) => {
        const docRef = doc(collection(db, 'security_logs'));
        const { id, ...logData } = log;
        return setDoc(docRef, logData);
      });

      await Promise.all(batchPromises);

      logger.info('Security logs flushed', { count: logsToFlush.length });

    } catch (error) {
      logger.error('Error flushing logs', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Verificar reglas de monitoreo
   */
  private async checkMonitoringRules(log: Omit<SecurityLog, 'id'>): Promise<void> {
    try {
      // Obtener reglas activas para esta categoría
      const rulesQuery = query(
        collection(db, 'monitoring_rules'),
        where('category', '==', log.category),
        where('isActive', '==', true)
      );

      const rulesSnapshot = await getDocs(rulesQuery);

      for (const ruleDoc of rulesSnapshot.docs) {
        const rule = { id: ruleDoc.id, ...ruleDoc.data() } as MonitoringRule;

        // Verificar condiciones
        if (this.evaluateRuleConditions(rule, log)) {
          await this.checkRuleThreshold(rule, log);
        }
      }

    } catch (error) {
      logger.error('Error checking monitoring rules', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Evaluar condiciones de una regla
   */
  private evaluateRuleConditions(rule: MonitoringRule, log: Omit<SecurityLog, 'id'>): boolean {
    return rule.conditions.every(condition => {
      const value = this.getLogFieldValue(log, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'contains':
          return String(value).includes(condition.value);
        case 'greater_than':
          return Number(value) > Number(condition.value);
        case 'less_than':
          return Number(value) < Number(condition.value);
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(value);
        case 'regex':
          return new RegExp(condition.value).test(String(value));
        default:
          return false;
      }
    });
  }

  /**
   * Obtener valor de campo del log
   */
  private getLogFieldValue(log: Omit<SecurityLog, 'id'>, field: string): any {
    const fields = field.split('.');
    let value: any = log;
    
    for (const f of fields) {
      value = value?.[f];
    }
    
    return value;
  }

  /**
   * Verificar umbral de regla
   */
  private async checkRuleThreshold(rule: MonitoringRule, log: Omit<SecurityLog, 'id'>): Promise<void> {
    try {
      const windowStart = new Date(Date.now() - rule.thresholds.timeWindow * 60 * 1000);

      // Contar eventos similares en la ventana de tiempo
      let eventCount = 1; // El evento actual

      const recentLogsQuery = query(
        collection(db, 'security_logs'),
        where('category', '==', rule.category),
        where('timestamp', '>=', windowStart),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const recentLogsSnapshot = await getDocs(recentLogsQuery);
      
      for (const logDoc of recentLogsSnapshot.docs) {
        const recentLog = logDoc.data();
        if (this.evaluateRuleConditions(rule, recentLog as SecurityLog)) {
          eventCount++;
        }
      }

      // Verificar si se excedió el umbral
      if (eventCount >= rule.thresholds.eventCount) {
        await this.triggerAlert({
          type: 'threshold_exceeded',
          severity: rule.thresholds.severity,
          title: `Umbral excedido: ${rule.name}`,
          description: `Se detectaron ${eventCount} eventos de tipo "${rule.name}" en ${rule.thresholds.timeWindow} minutos`,
          metrics: {
            eventCount,
            timeWindow: rule.thresholds.timeWindow,
            threshold: rule.thresholds.eventCount
          },
          actions: rule.actions.map(action => ({
            type: action.type,
            status: 'pending' as const,
            timestamp: new Date(),
            details: JSON.stringify(action.config)
          })),
          metadata: {
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            lastEvent: {
              event: log.event,
              ip: log.ip,
              userId: log.userId
            }
          }
        });
      }

    } catch (error) {
      logger.error('Error checking rule threshold', { 
        ruleId: rule.id,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Disparar alerta de seguridad
   */
  async triggerAlert(alertData: Omit<SecurityAlert, 'id' | 'triggeredAt' | 'status'>): Promise<void> {
    try {
      const alert: Omit<SecurityAlert, 'id'> = {
        ...alertData,
        triggeredAt: new Date(),
        status: 'active'
      };

      const docRef = doc(collection(db, 'security_alerts'));
      await setDoc(docRef, alert);

      // Log alerta
      logger.warn('Security alert triggered', {
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        eventCount: alert.metrics.eventCount
      });

      // Ejecutar acciones automáticas
      await this.executeAlertActions(docRef.id, alert.actions);

      // Notificar a administradores si es crítico
      if (alert.severity === 'critical' || alert.severity === 'high') {
        await this.notifyAdministrators(alert);
      }

    } catch (error) {
      logger.error('Error triggering alert', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Ejecutar acciones de alerta
   */
  private async executeAlertActions(alertId: string, actions: SecurityAlert['actions']): Promise<void> {
    for (const action of actions) {
      try {
        let success = false;
        let details = '';

        switch (action.type) {
          case 'notify':
            success = await this.sendNotification(action);
            details = 'Notification sent to administrators';
            break;
          case 'block':
            success = await this.blockEntity(action);
            details = 'Entity blocked successfully';
            break;
          case 'quarantine':
            success = await this.quarantineResource(action);
            details = 'Resource quarantined';
            break;
          case 'investigate':
            success = await this.startInvestigation(action);
            details = 'Investigation process initiated';
            break;
        }

        // Actualizar estado de la acción
        await updateDoc(doc(db, 'security_alerts', alertId), {
          [`actions.${actions.indexOf(action)}.status`]: success ? 'completed' : 'failed',
          [`actions.${actions.indexOf(action)}.details`]: details
        });

      } catch (error) {
        logger.error('Error executing alert action', { 
          alertId,
          actionType: action.type,
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  }

  /**
   * Enviar notificación
   */
  private async sendNotification(action: SecurityAlert['actions'][0]): Promise<boolean> {
    try {
      // Implementar notificación (email, Slack, webhook, etc.)
      logger.info('Security notification sent', { action });
      return true;
    } catch (error) {
      logger.error('Error sending notification', { error });
      return false;
    }
  }

  /**
   * Bloquear entidad (IP, usuario, etc.)
   */
  private async blockEntity(action: SecurityAlert['actions'][0]): Promise<boolean> {
    try {
      // Implementar bloqueo según el tipo de entidad
      logger.info('Entity blocked', { action });
      return true;
    } catch (error) {
      logger.error('Error blocking entity', { error });
      return false;
    }
  }

  /**
   * Poner en cuarentena recurso
   */
  private async quarantineResource(action: SecurityAlert['actions'][0]): Promise<boolean> {
    try {
      // Implementar cuarentena
      logger.info('Resource quarantined', { action });
      return true;
    } catch (error) {
      logger.error('Error quarantining resource', { error });
      return false;
    }
  }

  /**
   * Iniciar investigación
   */
  private async startInvestigation(action: SecurityAlert['actions'][0]): Promise<boolean> {
    try {
      // Implementar proceso de investigación automática
      logger.info('Investigation started', { action });
      return true;
    } catch (error) {
      logger.error('Error starting investigation', { error });
      return false;
    }
  }

  /**
   * Notificar a administradores
   */
  private async notifyAdministrators(alert: Omit<SecurityAlert, 'id'>): Promise<void> {
    try {
      // Implementar notificación a administradores
      logger.error('ADMINISTRATOR ALERT', {
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        eventCount: alert.metrics.eventCount
      });

    } catch (error) {
      logger.error('Error notifying administrators', { error });
    }
  }

  /**
   * Obtener logs de seguridad con filtros
   */
  async getSecurityLogs(filters: {
    category?: SecurityLog['category'];
    level?: SecurityLog['level'];
    userId?: string;
    ip?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<{ success: boolean; data?: SecurityLog[]; error?: string }> {
    try {
      let logsQuery = collection(db, 'security_logs');
      const constraints: any[] = [];

      // Aplicar filtros
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      if (filters.level) {
        constraints.push(where('level', '==', filters.level));
      }
      if (filters.userId) {
        constraints.push(where('userId', '==', filters.userId));
      }
      if (filters.ip) {
        constraints.push(where('ip', '==', filters.ip));
      }
      if (filters.startDate) {
        constraints.push(where('timestamp', '>=', filters.startDate));
      }
      if (filters.endDate) {
        constraints.push(where('timestamp', '<=', filters.endDate));
      }

      // Añadir ordenamiento y límite
      constraints.push(orderBy('timestamp', 'desc'));
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }

      const finalQuery = query(logsQuery, ...constraints);
      const snapshot = await getDocs(finalQuery);

      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SecurityLog));

      return { success: true, data: logs };

    } catch (error) {
      logger.error('Error getting security logs', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get logs'
      };
    }
  }

  /**
   * Obtener alertas activas
   */
  async getActiveAlerts(): Promise<{ success: boolean; data?: SecurityAlert[]; error?: string }> {
    try {
      const alertsQuery = query(
        collection(db, 'security_alerts'),
        where('status', 'in', ['active', 'investigating']),
        orderBy('triggeredAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(alertsQuery);
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SecurityAlert));

      return { success: true, data: alerts };

    } catch (error) {
      logger.error('Error getting active alerts', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get alerts'
      };
    }
  }

  /**
   * Recopilar métricas del sistema
   */
  async collectSystemMetrics(): Promise<{ success: boolean; data?: SystemMetrics; error?: string }> {
    try {
      // En un entorno real, estas métricas vendrían de servicios de monitoreo
      const metrics: Omit<SystemMetrics, 'id'> = {
        timestamp: new Date(),
        cpu: {
          usage: Math.random() * 100,
          load: [Math.random(), Math.random() * 2, Math.random() * 3]
        },
        memory: {
          used: Math.random() * 8000,
          total: 8000,
          percentage: Math.random() * 100
        },
        network: {
          inbound: Math.random() * 1000,
          outbound: Math.random() * 1000,
          connections: Math.floor(Math.random() * 500)
        },
        database: {
          connections: Math.floor(Math.random() * 100),
          responseTime: Math.random() * 50,
          errorRate: Math.random() * 5
        },
        application: {
          requestCount: Math.floor(Math.random() * 10000),
          errorCount: Math.floor(Math.random() * 100),
          responseTime: Math.random() * 200,
          activeUsers: Math.floor(Math.random() * 1000)
        },
        security: {
          failedLogins: Math.floor(Math.random() * 20),
          blockedIPs: Math.floor(Math.random() * 10),
          suspiciousActivities: Math.floor(Math.random() * 5)
        }
      };

      const docRef = doc(collection(db, 'system_metrics'));
      await setDoc(docRef, metrics);

      logger.info('System metrics collected', { timestamp: metrics.timestamp });

      return {
        success: true,
        data: { id: docRef.id, ...metrics }
      };

    } catch (error) {
      logger.error('Error collecting system metrics', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to collect metrics'
      };
    }
  }

  /**
   * Inicializar reglas de monitoreo predeterminadas
   */
  async initializeDefaultMonitoringRules(): Promise<{ success: boolean; error?: string }> {
    try {
      const defaultRules: Omit<MonitoringRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'Intentos de Login Fallidos',
          description: 'Detecta múltiples intentos de login fallidos desde la misma IP',
          category: 'authentication',
          conditions: [
            { field: 'event', operator: 'equals', value: 'login_failed' }
          ],
          thresholds: {
            eventCount: 5,
            timeWindow: 15,
            severity: 'medium'
          },
          actions: [
            { type: 'notify', config: { channel: 'email' } },
            { type: 'block_ip', config: { duration: 3600 } }
          ],
          isActive: true
        },
        {
          name: 'Acceso No Autorizado',
          description: 'Detecta intentos de acceso a recursos sin autorización',
          category: 'authorization',
          conditions: [
            { field: 'statusCode', operator: 'equals', value: 403 }
          ],
          thresholds: {
            eventCount: 10,
            timeWindow: 5,
            severity: 'high'
          },
          actions: [
            { type: 'notify', config: { channel: 'slack', urgency: 'high' } },
            { type: 'investigate', config: { auto: true } }
          ],
          isActive: true
        },
        {
          name: 'Actividad Sospechosa en Datos',
          description: 'Detecta acceso anómalo a datos sensibles',
          category: 'data_access',
          conditions: [
            { field: 'event', operator: 'contains', value: 'sensitive_data' },
            { field: 'level', operator: 'equals', value: 'warn' }
          ],
          thresholds: {
            eventCount: 3,
            timeWindow: 10,
            severity: 'high'
          },
          actions: [
            { type: 'notify', config: { channel: 'email', urgency: 'immediate' } },
            { type: 'quarantine', config: { resource: 'data_access' } }
          ],
          isActive: true
        },
        {
          name: 'Errores del Sistema',
          description: 'Detecta múltiples errores del sistema',
          category: 'system',
          conditions: [
            { field: 'level', operator: 'equals', value: 'error' }
          ],
          thresholds: {
            eventCount: 50,
            timeWindow: 5,
            severity: 'medium'
          },
          actions: [
            { type: 'notify', config: { channel: 'slack' } },
            { type: 'escalate', config: { team: 'engineering' } }
          ],
          isActive: true
        }
      ];

      for (const ruleData of defaultRules) {
        const docRef = doc(collection(db, 'monitoring_rules'));
        await setDoc(docRef, {
          ...ruleData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      logger.info('Default monitoring rules initialized');
      return { success: true };

    } catch (error) {
      logger.error('Error initializing monitoring rules', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize rules'
      };
    }
  }

  /**
   * Suscribirse a alertas en tiempo real
   */
  subscribeToAlerts(
    callback: (alerts: SecurityAlert[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    try {
      const alertsQuery = query(
        collection(db, 'security_alerts'),
        where('status', 'in', ['active', 'investigating']),
        orderBy('triggeredAt', 'desc'),
        limit(20)
      );

      const unsubscribe = onSnapshot(
        alertsQuery,
        (snapshot) => {
          const alerts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as SecurityAlert));
          
          callback(alerts);
        },
        (error) => {
          logger.error('Error in alerts subscription', { 
            error: error.message 
          });
          errorCallback?.(error);
        }
      );

      return unsubscribe;

    } catch (error) {
      logger.error('Error setting up alerts subscription', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return () => {};
    }
  }

  /**
   * Resolver alerta
   */
  async resolveAlert(
    alertId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'security_alerts', alertId), {
        status: 'resolved',
        resolvedAt: new Date(),
        resolution,
        assignedTo: resolvedBy
      });

      logger.info('Security alert resolved', { 
        alertId, 
        resolvedBy, 
        resolution 
      });

      return { success: true };

    } catch (error) {
      logger.error('Error resolving alert', { 
        alertId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resolve alert'
      };
    }
  }

  /**
   * Cleanup logs antiguos
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<{ success: boolean; cleaned: number; error?: string }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldLogsQuery = query(
        collection(db, 'security_logs'),
        where('timestamp', '<', cutoffDate),
        limit(1000) // Limpiar en lotes
      );

      const snapshot = await getDocs(oldLogsQuery);
      let cleaned = 0;

      // Eliminar en lotes para evitar timeouts
      const batchSize = 100;
      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = snapshot.docs.slice(i, i + batchSize);
        await Promise.all(batch.map(doc => doc.ref.delete()));
        cleaned += batch.length;
      }

      logger.info('Old security logs cleaned up', { 
        cleaned, 
        retentionDays 
      });

      return { success: true, cleaned };

    } catch (error) {
      logger.error('Error cleaning up old logs', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        cleaned: 0,
        error: error instanceof Error ? error.message : 'Failed to cleanup logs'
      };
    }
  }
}

export const securityMonitoringService = new SecurityMonitoringService();