#!/usr/bin/env node

/**
 * Sistema de Monitoramento para Múltiplos Usuários
 * Monitora CPU, memória, conexões e performance do sistema
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class SystemMonitor {
  constructor() {
    this.logFile = path.join(__dirname, '../logs/system-monitor.log');
    this.stats = {
      cpu: [],
      memory: [],
      connections: [],
      errors: [],
      timestamp: []
    };
    this.isRunning = false;
  }

  // Criar diretório de logs se não existir
  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  // Obter uso de CPU
  getCPUUsage() {
    return new Promise((resolve) => {
      exec('top -l 1 | grep "CPU usage"', (error, stdout) => {
        if (error) {
          resolve('N/A');
          return;
        }
        const match = stdout.match(/(\d+\.?\d*)%/);
        resolve(match ? parseFloat(match[1]) : 'N/A');
      });
    });
  }

  // Obter uso de memória
  getMemoryUsage() {
    return new Promise((resolve) => {
      exec('top -l 1 | grep "PhysMem"', (error, stdout) => {
        if (error) {
          resolve('N/A');
          return;
        }
        const match = stdout.match(/(\d+\.?\d*)M used/);
        resolve(match ? parseFloat(match[1]) : 'N/A');
      });
    });
  }

  // Obter número de conexões
  getConnections() {
    return new Promise((resolve) => {
      exec('netstat -an | grep :3000 | wc -l', (error, stdout) => {
        if (error) {
          resolve(0);
          return;
        }
        resolve(parseInt(stdout.trim()) || 0);
      });
    });
  }

  // Obter uso de disco
  getDiskUsage() {
    return new Promise((resolve) => {
      exec('df -h . | tail -1 | awk \'{print $5}\'', (error, stdout) => {
        if (error) {
          resolve('N/A');
          return;
        }
        const usage = stdout.trim().replace('%', '');
        resolve(parseFloat(usage) || 'N/A');
      });
    });
  }

  // Log das estatísticas
  logStats(stats) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      cpu: stats.cpu,
      memory: stats.memory,
      connections: stats.connections,
      disk: stats.disk
    };

    // Adicionar às estatísticas em memória
    this.stats.cpu.push(stats.cpu);
    this.stats.memory.push(stats.memory);
    this.stats.connections.push(stats.connections);
    this.stats.timestamp.push(timestamp);

    // Manter apenas últimas 100 entradas
    if (this.stats.cpu.length > 100) {
      this.stats.cpu.shift();
      this.stats.memory.shift();
      this.stats.connections.shift();
      this.stats.timestamp.shift();
    }

    // Escrever no arquivo de log
    const logLine = `${timestamp} | CPU: ${stats.cpu}% | Memory: ${stats.memory}M | Connections: ${stats.connections} | Disk: ${stats.disk}%\n`;
    fs.appendFileSync(this.logFile, logLine);

    // Console output colorido
    const cpuColor = stats.cpu > 80 ? '\x1b[31m' : stats.cpu > 60 ? '\x1b[33m' : '\x1b[32m';
    const memColor = stats.memory > 80 ? '\x1b[31m' : stats.memory > 60 ? '\x1b[33m' : '\x1b[32m';
    const connColor = stats.connections > 50 ? '\x1b[31m' : stats.connections > 20 ? '\x1b[33m' : '\x1b[32m';

    console.log(`\x1b[36m[${timestamp}]\x1b[0m ${cpuColor}CPU: ${stats.cpu}%\x1b[0m | ${memColor}Memory: ${stats.memory}M\x1b[0m | ${connColor}Connections: ${stats.connections}\x1b[0m | Disk: ${stats.disk}%`);
  }

  // Gerar relatório de performance
  generateReport() {
    const avgCPU = this.stats.cpu.filter(x => x !== 'N/A').reduce((a, b) => a + b, 0) / this.stats.cpu.filter(x => x !== 'N/A').length;
    const avgMemory = this.stats.memory.filter(x => x !== 'N/A').reduce((a, b) => a + b, 0) / this.stats.memory.filter(x => x !== 'N/A').length;
    const maxConnections = Math.max(...this.stats.connections);
    const avgConnections = this.stats.connections.reduce((a, b) => a + b, 0) / this.stats.connections.length;

    const report = `
=== RELATÓRIO DE PERFORMANCE ===
Período: ${this.stats.timestamp[0]} até ${this.stats.timestamp[this.stats.timestamp.length - 1]}
Amostras: ${this.stats.timestamp.length}

CPU:
  - Média: ${avgCPU.toFixed(2)}%
  - Máximo: ${Math.max(...this.stats.cpu.filter(x => x !== 'N/A'))}%
  - Status: ${avgCPU > 80 ? '🔴 CRÍTICO' : avgCPU > 60 ? '🟡 ATENÇÃO' : '🟢 NORMAL'}

Memória:
  - Média: ${avgMemory.toFixed(2)}M
  - Máximo: ${Math.max(...this.stats.memory.filter(x => x !== 'N/A'))}M
  - Status: ${avgMemory > 80 ? '🔴 CRÍTICO' : avgMemory > 60 ? '🟡 ATENÇÃO' : '🟢 NORMAL'}

Conexões:
  - Média: ${avgConnections.toFixed(2)}
  - Máximo: ${maxConnections}
  - Status: ${maxConnections > 50 ? '🔴 CRÍTICO' : maxConnections > 20 ? '🟡 ATENÇÃO' : '🟢 NORMAL'}

RECOMENDAÇÕES:
${avgCPU > 80 ? '⚠️ CPU muito alta - Considere otimizações ou mais recursos' : ''}
${avgMemory > 80 ? '⚠️ Memória muito alta - Considere otimizações ou mais RAM' : ''}
${maxConnections > 50 ? '⚠️ Muitas conexões - Considere load balancing' : ''}
${avgCPU < 50 && avgMemory < 50 && maxConnections < 20 ? '✅ Sistema funcionando bem - Capacidade para mais usuários' : ''}
`;

    console.log(report);
    fs.writeFileSync(path.join(__dirname, '../logs/performance-report.txt'), report);
  }

  // Iniciar monitoramento
  async start(interval = 30000) { // 30 segundos por padrão
    this.ensureLogDirectory();
    this.isRunning = true;

    console.log(`🚀 Iniciando monitoramento do sistema...`);
    console.log(`📊 Intervalo: ${interval / 1000} segundos`);
    console.log(`📝 Log: ${this.logFile}`);
    console.log(`⏰ ${new Date().toLocaleString()}\n`);

    const monitor = async () => {
      if (!this.isRunning) return;

      try {
        const [cpu, memory, connections, disk] = await Promise.all([
          this.getCPUUsage(),
          this.getMemoryUsage(),
          this.getConnections(),
          this.getDiskUsage()
        ]);

        this.logStats({ cpu, memory, connections, disk });

        // Alertas críticos
        if (cpu > 90) {
          console.log(`\x1b[31m🚨 ALERTA: CPU muito alta (${cpu}%)\x1b[0m`);
        }
        if (memory > 90) {
          console.log(`\x1b[31m🚨 ALERTA: Memória muito alta (${memory}M)\x1b[0m`);
        }
        if (connections > 100) {
          console.log(`\x1b[31m🚨 ALERTA: Muitas conexões (${connections})\x1b[0m`);
        }

      } catch (error) {
        console.error('Erro no monitoramento:', error);
        this.stats.errors.push(error.message);
      }

      setTimeout(monitor, interval);
    };

    monitor();
  }

  // Parar monitoramento
  stop() {
    this.isRunning = false;
    console.log('\n🛑 Monitoramento parado');
    this.generateReport();
  }
}

// Execução do script
if (require.main === module) {
  const monitor = new SystemMonitor();
  
  // Capturar Ctrl+C para parar graciosamente
  process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
  });

  // Argumentos da linha de comando
  const interval = process.argv[2] ? parseInt(process.argv[2]) * 1000 : 30000;
  
  monitor.start(interval);
}

module.exports = SystemMonitor;
