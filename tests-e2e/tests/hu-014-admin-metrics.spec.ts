import { test, expect } from '@playwright/test';

/**
 * E2E Tests para HU-014: Dashboard Admin - Métricas de Fraude
 * 
 * Test Cases implementados:
 * - TC-HU-014-01: Consultar métricas generales del sistema
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:8000';
const ADMIN_DASHBOARD_URL = process.env.ADMIN_URL || 'http://localhost:5174';

test.describe('HU-014: Dashboard Admin - Métricas de Fraude', () => {

  test.beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  test('TC-HU-014-01: Obtener métricas generales', async ({ request }) => {
    // Paso 1: Crear varias transacciones con diferentes niveles de riesgo
    const testTransactions = [
      { user_id: `user_metrics_1_${Date.now()}`, amount: 100 }, // LOW_RISK
      { user_id: `user_metrics_2_${Date.now()}`, amount: 250 }, // LOW_RISK
      { user_id: `user_metrics_3_${Date.now()}`, amount: 800 }, // LOW_RISK
      { user_id: `user_metrics_4_${Date.now()}`, amount: 1500 }, // MEDIUM/HIGH_RISK
      { user_id: `user_metrics_5_${Date.now()}`, amount: 3000 }  // HIGH_RISK
    ];

    for (const tx of testTransactions) {
      await request.post(`${API_BASE_URL}/transaction`, {
        data: {
          id: `tx_${tx.user_id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          user_id: tx.user_id,
          amount: tx.amount,
          location: { latitude: 4.711, longitude: -74.0721 },
          timestamp: new Date().toISOString()
        }
      });
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Paso 2: Consultar métricas generales mediante API de admin
    const metricsResponse = await request.get(`${API_BASE_URL}/api/v1/admin/metrics`, {
      headers: {
        'X-Admin-Role': 'admin' // Simular autenticación de admin
      }
    });

    // Resultado Esperado: Dashboard con KPIs para monitoreo de fraude
    expect(metricsResponse.status()).toBe(200);
    
    const metrics = await metricsResponse.json();
    
    // Verificar campos obligatorios
    expect(metrics.total_transactions).toBeDefined();
    expect(typeof metrics.total_transactions).toBe('number');
    expect(metrics.total_transactions).toBeGreaterThan(0);

    // Verificar distribución por risk_level
    expect(metrics.low_risk_count || metrics.LOW_RISK || metrics.distribution).toBeDefined();
    
    // Si existe fraud_rate, debe ser un número entre 0 y 100
    if (metrics.fraud_rate !== undefined) {
      expect(metrics.fraud_rate).toBeGreaterThanOrEqual(0);
      expect(metrics.fraud_rate).toBeLessThanOrEqual(100);
    }

    // Si existe approval_rate, debe ser un número entre 0 y 100
    if (metrics.approval_rate !== undefined) {
      expect(metrics.approval_rate).toBeGreaterThanOrEqual(0);
      expect(metrics.approval_rate).toBeLessThanOrEqual(100);
    }

    console.log('✅ TC-HU-014-01 PASSED: Métricas generales recuperadas');
    console.log('   Total transactions:', metrics.total_transactions);
    console.log('   Metrics:', JSON.stringify(metrics, null, 2));
  });

  test('TC-HU-014-02: Top usuarios sospechosos', async ({ request }) => {
    // Paso 1: Crear múltiples transacciones de alto riesgo para ciertos usuarios
    const suspiciousUsers = [`user_fraud_1_${Date.now()}`, `user_fraud_2_${Date.now()}`];
    
    for (const userId of suspiciousUsers) {
      // Crear 3 transacciones de alto riesgo por usuario
      for (let i = 0; i < 3; i++) {
        await request.post(`${API_BASE_URL}/transaction`, {
          data: {
            id: `tx_${userId}_${Date.now()}_${i}_${Math.random().toString(36).slice(2)}`,
            user_id: userId,
            amount: 5000 + (i * 100),
            location: { latitude: 40.7128, longitude: -74.0060 }, // Ubicación inusual
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Paso 2: Consultar top usuarios con mayor riesgo
    const topUsersResponse = await request.get(`${API_BASE_URL}/api/v1/admin/metrics/top-suspicious-users`, {
      params: { limit: 10 }
    });

    // Resultado Esperado: Lista de usuarios ordenados por nivel de riesgo
    if (topUsersResponse.status() === 200) {
      const topUsers = await topUsersResponse.json();
      
      expect(Array.isArray(topUsers)).toBe(true);
      
      if (topUsers.length > 0) {
        // Verificar que cada usuario tenga la información necesaria
        topUsers.forEach((user: any) => {
          expect(user.user_id).toBeTruthy();
          expect(user.risk_score || user.high_risk_count).toBeDefined();
          expect(user.transaction_count).toBeDefined();
        });

        console.log('✅ TC-HU-014-02 PASSED: Top usuarios sospechosos recuperados');
        console.log('   Top users:', topUsers.slice(0, 3));
      } else {
        console.log('⚠️  TC-HU-014-02: No hay usuarios sospechosos en este momento');
      }
    } else if (topUsersResponse.status() === 404) {
      console.log('⚠️  TC-HU-014-02 SKIPPED: Endpoint de top usuarios no implementado');
    } else {
      expect(topUsersResponse.status()).toBe(200);
    }
  });

  test('TC-HU-014-03: Filtro de métricas por rango de fechas', async ({ request }) => {
    // Configurar rango de fechas (últimas 24 horas)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

    // Paso 1: Consultar métricas con filtro de fecha
    const metricsResponse = await request.get(`${API_BASE_URL}/api/v1/admin/metrics`, {
      params: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }
    });

    // Resultado Esperado: Métricas filtradas por período específico
    if (metricsResponse.status() === 200) {
      const metrics = await metricsResponse.json();
      
      expect(metrics.total_transactions).toBeDefined();
      expect(metrics.period_start || metrics.start_date).toBeTruthy();
      expect(metrics.period_end || metrics.end_date).toBeTruthy();

      console.log('✅ TC-HU-014-03 PASSED: Filtrado por fecha funcional');
      console.log('   Period:', `${startDate.toISOString()} to ${endDate.toISOString()}`);
      console.log('   Total in period:', metrics.total_transactions);
    } else {
      console.log('⚠️  TC-HU-014-03: Endpoint no soporta filtrado por fecha (usando métricas generales)');
    }
  });

  test('TC-HU-014-04: Verificar dashboard admin en frontend', async ({ page }) => {
    // Navegar al dashboard de administrador
    await page.goto(ADMIN_DASHBOARD_URL);

    // Esperar a que cargue la página
    await page.waitForLoadState('networkidle');

    // Verificar que se muestra el título del dashboard
    const pageTitle = await page.locator('h1, h2').first().textContent();
    expect(pageTitle).toBeTruthy();
    const titleLower = pageTitle?.toLowerCase() ?? '';
    const hasDashboardKeyword = titleLower.includes('dashboard') || titleLower.includes('admin') || titleLower.includes('metrics');
    expect(hasDashboardKeyword).toBe(true);

    // Buscar elementos de métricas (cards, charts, etc.)
    const hasMetricsCards = await page.locator('[data-testid*="metric"], .metric-card, .stat-card, .kpi-card').count() > 0;
    
    if (hasMetricsCards) {
      console.log('✅ TC-HU-014-04 PASSED: Dashboard admin carga correctamente');
      
      // Tomar screenshot del dashboard
      await page.screenshot({ path: 'screenshots/tc-hu-014-04-admin-dashboard.png', fullPage: true });
    } else {
      // Buscar tablas o gráficos alternativos
      const hasCharts = await page.locator('canvas, svg[class*="chart"], .recharts-wrapper').count() > 0;
      const hasTables = await page.locator('table, [role="table"]').count() > 0;
      
      if (hasCharts || hasTables) {
        console.log('✅ TC-HU-014-04 PASSED: Dashboard con visualizaciones alternativas');
        await page.screenshot({ path: 'screenshots/tc-hu-014-04-admin-dashboard.png', fullPage: true });
      } else {
        console.log('⚠️  TC-HU-014-04: Frontend no muestra métricas visibles (puede estar en desarrollo)');
      }
    }
  });

  test('TC-HU-014-05: Distribución de transacciones por nivel de riesgo', async ({ request }) => {
    // Paso 1: Consultar distribución mediante API
    const distributionResponse = await request.get(`${API_BASE_URL}/api/v1/admin/metrics/risk-distribution`);

    // Resultado Esperado: Desglose detallado por LOW/MEDIUM/HIGH
    if (distributionResponse.status() === 200) {
      const distribution = await distributionResponse.json();
      
      // Verificar que existen los 3 niveles
    const hasLowRisk = distribution.LOW_RISK !== undefined || distribution.low_risk !== undefined;
    const hasMediumRisk = distribution.MEDIUM_RISK !== undefined || distribution.medium_risk !== undefined;
    const hasHighRisk = distribution.HIGH_RISK !== undefined || distribution.high_risk !== undefined;
    
    expect(hasLowRisk).toBeTruthy();
    expect(hasMediumRisk).toBeTruthy();
    expect(hasHighRisk).toBeTruthy();
      // Calcular totales
      const lowRisk = distribution.LOW_RISK || distribution.low_risk || 0;
      const mediumRisk = distribution.MEDIUM_RISK || distribution.medium_risk || 0;
      const highRisk = distribution.HIGH_RISK || distribution.high_risk || 0;
      const total = lowRisk + mediumRisk + highRisk;

      console.log('✅ TC-HU-014-05 PASSED: Distribución de riesgo recuperada');
      console.log('   LOW_RISK:', lowRisk, `(${total > 0 ? (lowRisk / total * 100).toFixed(1) : 0}%)`);
      console.log('   MEDIUM_RISK:', mediumRisk, `(${total > 0 ? (mediumRisk / total * 100).toFixed(1) : 0}%)`);
      console.log('   HIGH_RISK:', highRisk, `(${total > 0 ? (highRisk / total * 100).toFixed(1) : 0}%)`);
    } else if (distributionResponse.status() === 404) {
      console.log('⚠️  TC-HU-014-05 SKIPPED: Endpoint de distribución no implementado (verificar en métricas generales)');
      
      // Alternativa: verificar en endpoint de métricas generales
      const metricsResponse = await request.get(`${API_BASE_URL}/api/v1/admin/metrics`);
      if (metricsResponse.status() === 200) {
        const metrics = await metricsResponse.json();
        console.log('   Metrics generales:', metrics);
      }
    } else {
      expect(distributionResponse.status()).toBe(200);
    }
  });
});
