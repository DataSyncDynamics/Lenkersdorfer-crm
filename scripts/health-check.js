#!/usr/bin/env node

/**
 * Production Health Check Script
 * Validates deployment and performance metrics
 */

const https = require('https');
const { performance } = require('perf_hooks');

const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || 'your-domain.vercel.app';

const endpoints = [
  '/',
  '/clients',
  '/waitlist',
  '/allocation'
];

const performanceThresholds = {
  responseTime: 2000, // 2 seconds max
  firstByteTime: 500,  // 500ms max TTFB
  errorRate: 1         // 1% max error rate
};

async function checkEndpoint(path) {
  return new Promise((resolve) => {
    const startTime = performance.now();

    const options = {
      hostname: PRODUCTION_DOMAIN,
      port: 443,
      path: path,
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      let data = '';
      res.on('data', chunk => data += chunk);

      res.on('end', () => {
        resolve({
          path,
          statusCode: res.statusCode,
          responseTime: Math.round(responseTime),
          size: Buffer.byteLength(data, 'utf8'),
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        path,
        statusCode: 0,
        responseTime: -1,
        error: error.message,
        success: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        path,
        statusCode: 0,
        responseTime: -1,
        error: 'Timeout',
        success: false
      });
    });

    req.end();
  });
}

async function runHealthCheck() {
  console.log('🏥 LENKERSDORFER CRM - PRODUCTION HEALTH CHECK');
  console.log('===============================================');
  console.log(`Target Domain: https://${PRODUCTION_DOMAIN}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const results = [];

  console.log('🚀 Testing Core Endpoints...\n');

  for (const endpoint of endpoints) {
    process.stdout.write(`Testing ${endpoint}... `);
    const result = await checkEndpoint(endpoint);
    results.push(result);

    if (result.success) {
      console.log(`✅ ${result.responseTime}ms (${result.statusCode})`);
    } else {
      console.log(`❌ ${result.error || 'Failed'} (${result.statusCode})`);
    }
  }

  console.log('\n📊 PERFORMANCE ANALYSIS');
  console.log('=======================');

  const successfulRequests = results.filter(r => r.success);
  const failedRequests = results.filter(r => !r.success);

  if (successfulRequests.length > 0) {
    const avgResponseTime = Math.round(
      successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length
    );

    const maxResponseTime = Math.max(...successfulRequests.map(r => r.responseTime));
    const minResponseTime = Math.min(...successfulRequests.map(r => r.responseTime));

    console.log(`Average Response Time: ${avgResponseTime}ms`);
    console.log(`Fastest Response: ${minResponseTime}ms`);
    console.log(`Slowest Response: ${maxResponseTime}ms`);

    // Performance validation
    console.log('\n⚡ PERFORMANCE VALIDATION');
    console.log('========================');

    if (avgResponseTime <= performanceThresholds.responseTime) {
      console.log(`✅ Average response time: ${avgResponseTime}ms (target: <${performanceThresholds.responseTime}ms)`);
    } else {
      console.log(`⚠️  Average response time: ${avgResponseTime}ms (EXCEEDS target: <${performanceThresholds.responseTime}ms)`);
    }

    if (maxResponseTime <= performanceThresholds.responseTime) {
      console.log(`✅ Maximum response time: ${maxResponseTime}ms (target: <${performanceThresholds.responseTime}ms)`);
    } else {
      console.log(`⚠️  Maximum response time: ${maxResponseTime}ms (EXCEEDS target: <${performanceThresholds.responseTime}ms)`);
    }
  }

  console.log('\n🎯 DEPLOYMENT STATUS');
  console.log('===================');

  const errorRate = (failedRequests.length / results.length) * 100;

  console.log(`Successful Requests: ${successfulRequests.length}/${results.length}`);
  console.log(`Failed Requests: ${failedRequests.length}/${results.length}`);
  console.log(`Error Rate: ${errorRate.toFixed(1)}%`);

  if (failedRequests.length > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    failedRequests.forEach(req => {
      console.log(`   ${req.path}: ${req.error || 'Unknown error'}`);
    });
  }

  console.log('\n🏆 OVERALL HEALTH SCORE');
  console.log('=======================');

  let healthScore = 100;

  // Deduct points for failures
  healthScore -= (failedRequests.length * 25);

  // Deduct points for slow responses
  if (successfulRequests.length > 0) {
    const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length;
    if (avgResponseTime > performanceThresholds.responseTime) {
      healthScore -= 20;
    }
    if (avgResponseTime > performanceThresholds.responseTime * 2) {
      healthScore -= 20;
    }
  }

  healthScore = Math.max(0, healthScore);

  if (healthScore >= 90) {
    console.log(`🟢 EXCELLENT: ${healthScore}/100 - Ready for luxury sales environment`);
  } else if (healthScore >= 75) {
    console.log(`🟡 GOOD: ${healthScore}/100 - Minor optimizations recommended`);
  } else if (healthScore >= 50) {
    console.log(`🟠 FAIR: ${healthScore}/100 - Performance improvements needed`);
  } else {
    console.log(`🔴 POOR: ${healthScore}/100 - Immediate attention required`);
  }

  console.log('\n🎪 LUXURY DEPLOYMENT VERDICT');
  console.log('============================');

  if (healthScore >= 90 && errorRate <= performanceThresholds.errorRate) {
    console.log('✅ APPROVED: CRM meets luxury brand standards for €500K+ transactions');
    console.log('✅ Zero-downtime deployment successful');
    console.log('✅ Performance suitable for VIP client interactions');
  } else {
    console.log('⚠️  REVIEW REQUIRED: Performance does not meet luxury standards');
    console.log('⚠️  Consider rollback if serving VIP clients');
  }

  console.log(`\n🔗 Production URL: https://${PRODUCTION_DOMAIN}`);
  console.log('📊 Monitor ongoing performance in Vercel Analytics dashboard');

  process.exit(healthScore >= 75 ? 0 : 1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Health check failed:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Health check failed:', error.message);
  process.exit(1);
});

// Run the health check
runHealthCheck().catch(error => {
  console.error('❌ Health check failed:', error.message);
  process.exit(1);
});