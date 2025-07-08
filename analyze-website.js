#!/usr/bin/env node

/**
 * RowCast Website Analyzer
 * Uses Puppeteer to analyze the live website and diagnose data population issues
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const { spawn, exec } = require('child_process');
const path = require('path');

class WebsiteAnalyzer {
    constructor() {
        this.siteUrl = process.argv.includes('--url') ? 
            process.argv[process.argv.indexOf('--url') + 1] : 
            'http://localhost:3002';
        this.apiUrl = 'http://localhost:5000/api';
        this.results = [];
        this.viteProcess = null;
        this.serverStarted = false;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        console.log(logEntry);
        this.results.push({ timestamp, type, message });
    }

    async analyze() {
        const browser = await puppeteer.launch({
            headless: 'new', // Use new headless mode
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });

        try {
            // Check if server is running, if not start it
            await this.ensureServerRunning();
            
            const page = await browser.newPage();
            
            // Enable console logging from the page
            page.on('console', msg => {
                const msgText = msg.text();
                this.log(`BROWSER CONSOLE [${msg.type()}]: ${msgText}`, 'browser');
                
                // Look for specific error details
                if (msgText.includes('Loading all data...')) {
                    this.log('Data loading attempt detected', 'info');
                }
                if (msgText.includes('Attempting primary API:')) {
                    this.log('API call attempt detected', 'info');
                }
                if (msgText.includes('Response received:')) {
                    this.log('API response received', 'info');
                }
            });

            // Enable error logging
            page.on('pageerror', error => {
                this.log(`PAGE ERROR: ${error.message}`, 'error');
                this.log(`PAGE ERROR STACK: ${error.stack}`, 'error');
            });

            // Enable network request monitoring
            page.on('request', request => {
                if (request.url().includes('/api/')) {
                    this.log(`API REQUEST: ${request.method()} ${request.url()}`, 'network');
                }
            });

            page.on('response', response => {
                if (response.url().includes('/api/')) {
                    this.log(`API RESPONSE: ${response.status()} ${response.url()}`, 'network');
                }
            });

            this.log('🚀 Starting website analysis...');
            
            // Test 1: API Connectivity
            await this.testAPIConnectivity();
            
            // Test 2: Load the page
            await this.loadPage(page);
            
            // Test 3: Check element structure
            await this.checkElementStructure(page);
            
            // Test 4: Check JavaScript execution
            await this.checkJavaScriptExecution(page);
            
            // Test 5: Check data population
            await this.checkDataPopulation(page);
            
            // Test 6: Test navigation
            await this.testNavigation(page);
            
            // Test 7: Force data update
            await this.forceDataUpdate(page);
            
            // Generate report
            await this.generateReport();
            
        } catch (error) {
            this.log(`ANALYZER ERROR: ${error.message}`, 'error');
        } finally {
            // Clean up server if we started it
            if (this.viteProcess && this.serverStarted) {
                this.log('Stopping Vite preview server...');
                this.viteProcess.kill();
            }
            await browser.close();
        }
    }

    async testAPIConnectivity() {
        this.log('Testing API connectivity...');
        
        try {
            const response = await fetch(`${this.apiUrl}/complete`);
            if (response.ok) {
                const data = await response.json();
                this.log(`✅ API responding: ${Object.keys(data).join(', ')}`, 'success');
                
                if (data.current) {
                    this.log(`✅ Current data available: score=${data.current.rowcastScore}, temp=${data.current.weather?.currentTemp}°F`, 'success');
                } else {
                    this.log('❌ No current data in API response', 'error');
                }
            } else {
                this.log(`❌ API error: ${response.status}`, 'error');
            }
        } catch (error) {
            this.log(`❌ API connection failed: ${error.message}`, 'error');
        }
    }

    async loadPage(page) {
        this.log('Loading website page...');
        
        try {
            await page.goto(this.siteUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            this.log('✅ Page loaded successfully', 'success');
            
            // Take screenshot
            await page.screenshot({ path: 'analysis-screenshot.png', fullPage: true });
            this.log('📸 Screenshot saved as analysis-screenshot.png', 'info');
            
        } catch (error) {
            this.log(`❌ Failed to load page: ${error.message}`, 'error');
            throw error;
        }
    }

    async checkElementStructure(page) {
        this.log('Checking element structure...');
        
        const elementsToCheck = [
            'currentScore', 'currentTemp', 'currentWind', 'currentFlow',
            'weatherTemp', 'feelsLike', 'dashboardScore'
        ];

        for (const elementId of elementsToCheck) {
            const element = await page.$(`#${elementId}`);
            if (element) {
                const text = await page.evaluate(el => el.textContent, element);
                const classes = await page.evaluate(el => el.className, element);
                this.log(`✅ Element #${elementId}: "${text}" (classes: ${classes})`, 'success');
            } else {
                this.log(`❌ Element #${elementId} not found`, 'error');
            }
        }
    }

    async checkJavaScriptExecution(page) {
        this.log('Checking JavaScript execution...');
        
        try {
            // Check if RowCast app is initialized
            const appExists = await page.evaluate(() => {
                return typeof window.rowcastApp !== 'undefined';
            });
            
            if (appExists) {
                this.log('✅ RowCast app object exists', 'success');
                
                // Get app state
                const appState = await page.evaluate(() => {
                    const app = window.rowcastApp;
                    return {
                        currentPage: app.currentPage,
                        hasData: !!app.data?.current,
                        apiBaseUrl: app.apiBaseUrl,
                        dataKeys: app.data ? Object.keys(app.data) : []
                    };
                });
                
                this.log(`✅ App state: page=${appState.currentPage}, hasData=${appState.hasData}, apiUrl=${appState.apiBaseUrl}`, 'success');
                
                if (appState.hasData) {
                    const currentData = await page.evaluate(() => window.rowcastApp.data.current);
                    this.log(`✅ Current data loaded: ${JSON.stringify(currentData, null, 2)}`, 'success');
                } else {
                    this.log('❌ No data in app object', 'error');
                }
                
            } else {
                this.log('❌ RowCast app object not found', 'error');
            }
            
        } catch (error) {
            this.log(`❌ JavaScript check failed: ${error.message}`, 'error');
        }
    }

    async checkDataPopulation(page) {
        this.log('Checking data population...');
        
        const elementsToCheck = [
            { id: 'currentScore', expected: /^\d+%$/ },
            { id: 'currentTemp', expected: /^\d+°F$/ },
            { id: 'currentWind', expected: /^\d+\.?\d* mph$/ },
            { id: 'currentFlow', expected: /^\d+ cfs$/ }
        ];

        for (const { id, expected } of elementsToCheck) {
            try {
                const text = await page.evaluate(elementId => {
                    const el = document.getElementById(elementId);
                    return el ? el.textContent.trim() : null;
                }, id);
                
                if (text) {
                    if (expected.test(text)) {
                        this.log(`✅ Element #${id} has valid data: "${text}"`, 'success');
                    } else if (text === '--' || text.includes('--')) {
                        this.log(`❌ Element #${id} shows placeholder: "${text}"`, 'error');
                    } else {
                        this.log(`⚠️ Element #${id} has unexpected format: "${text}"`, 'warning');
                    }
                } else {
                    this.log(`❌ Element #${id} not found or empty`, 'error');
                }
            } catch (error) {
                this.log(`❌ Failed to check element #${id}: ${error.message}`, 'error');
            }
        }
    }

    async testNavigation(page) {
        this.log('Testing navigation...');
        
        const pages = ['home', 'weather', 'dashboard', 'api'];
        
        for (const pageName of pages) {
            try {
                // Click navigation link
                await page.click(`[data-page="${pageName}"]`);
                await page.waitForFunction(() => true, { timeout: 1000 });
                
                // Check if page is visible
                const pageVisible = await page.evaluate(pageId => {
                    const pageEl = document.getElementById(pageId);
                    return pageEl && !pageEl.classList.contains('hidden');
                }, pageName);
                
                if (pageVisible) {
                    this.log(`✅ Navigation to ${pageName} page works`, 'success');
                } else {
                    this.log(`❌ Navigation to ${pageName} page failed`, 'error');
                }
                
            } catch (error) {
                this.log(`❌ Navigation test failed for ${pageName}: ${error.message}`, 'error');
            }
        }
    }

    async forceDataUpdate(page) {
        this.log('Attempting to force data update...');
        
        try {
            // First try clicking the debug button
            this.log('Clicking debug button...');
            await page.click('#debugButton');
            
            // Wait for debug output
            await page.waitForTimeout(2000);
            
            // Try to call the app's loadAllData method directly
            const result = await page.evaluate(async () => {
                if (window.rowcastApp && window.rowcastApp.loadAllData) {
                    console.log('Forcing data reload...');
                    try {
                        await window.rowcastApp.loadAllData();
                        console.log('Data reload completed');
                        return { success: true, error: null };
                    } catch (error) {
                        console.error('Data reload failed:', error);
                        return { 
                            success: false, 
                            error: error.message || error.toString(),
                            stack: error.stack,
                            name: error.name
                        };
                    }
                } else {
                    return { success: false, error: 'loadAllData method not found' };
                }
            });
            
            if (result.success) {
                this.log('✅ Force data update succeeded', 'success');
            } else {
                this.log(`❌ Force data update failed: ${result.error}`, 'error');
                if (result.stack) {
                    this.log(`Error stack: ${result.stack}`, 'error');
                }
            }
            
            // Wait for updates
            await page.waitForFunction(() => true, { timeout: 3000 });
            
            // Check if data was populated
            await this.checkDataPopulation(page);
            
        } catch (error) {
            this.log(`❌ Force data update failed: ${error.message}`, 'error');
        }
    }

    async generateReport() {
        this.log('📋 Generating analysis report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.length,
                errors: this.results.filter(r => r.type === 'error').length,
                warnings: this.results.filter(r => r.type === 'warning').length,
                successes: this.results.filter(r => r.type === 'success').length
            },
            results: this.results
        };
        
        await fs.writeFile('website-analysis-report.json', JSON.stringify(report, null, 2));
        this.log('✅ Report saved to website-analysis-report.json', 'success');
        
        // Print summary
        console.log('\n📋 ANALYSIS SUMMARY:');
        console.log(`✅ Successes: ${report.summary.successes}`);
        console.log(`⚠️ Warnings: ${report.summary.warnings}`);
        console.log(`❌ Errors: ${report.summary.errors}`);
        console.log(`📊 Total checks: ${report.summary.total}`);
    }

    async ensureServerRunning() {
        this.log('Checking if development server is running...');
        
        try {
            // Test if server is already running
            const response = await fetch(this.siteUrl);
            if (response.ok) {
                this.log('✅ Development server is already running', 'success');
                return;
            }
        } catch (error) {
            // Server not running, we need to start it
        }
        
        // Check dependencies first
        await this.checkDependencies();
        
        // Check if dist folder exists, if not build first
        const distPath = path.join(process.cwd(), 'dist');
        try {
            await fs.access(distPath);
            this.log('✅ Build files found in dist folder', 'success');
        } catch {
            this.log('Building project first...');
            await this.buildProject();
        }
        
        this.log('Starting Vite preview server...');
        
        return new Promise((resolve, reject) => {
            // Start vite preview
            this.viteProcess = spawn('npx', ['vite', 'preview', '--port', '3002', '--host'], {
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false
            });
            
            this.serverStarted = true;
            let outputBuffer = '';
            
            this.viteProcess.stdout.on('data', (data) => {
                const output = data.toString();
                outputBuffer += output;
                
                // Check if server is ready
                if (output.includes('Local:') || output.includes('preview server started')) {
                    this.log('✅ Vite preview server started successfully', 'success');
                    // Wait a bit more for server to be fully ready
                    setTimeout(resolve, 2000);
                }
            });
            
            this.viteProcess.stderr.on('data', (data) => {
                const error = data.toString();
                if (error.includes('EADDRINUSE')) {
                    this.log('⚠️ Port 3002 is already in use, assuming server is running', 'warning');
                    resolve();
                } else {
                    this.log(`Vite output: ${error}`, 'info');
                }
            });
            
            this.viteProcess.on('error', (error) => {
                this.log(`Failed to start Vite: ${error.message}`, 'error');
                reject(error);
            });
            
            // Set a timeout in case the server doesn't start
            setTimeout(() => {
                if (!outputBuffer.includes('Local:') && !outputBuffer.includes('preview server started')) {
                    this.log('⚠️ Vite server start timeout, proceeding anyway...', 'warning');
                    resolve();
                }
            }, 10000);
        });
    }

    async buildProject() {
        this.log('Building project with Vite...');
        
        return new Promise((resolve, reject) => {
            const buildProcess = spawn('npx', ['vite', 'build'], {
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            buildProcess.stdout.on('data', (data) => {
                this.log(`Build: ${data.toString().trim()}`, 'info');
            });
            
            buildProcess.stderr.on('data', (data) => {
                this.log(`Build error: ${data.toString().trim()}`, 'warning');
            });
            
            buildProcess.on('close', (code) => {
                if (code === 0) {
                    this.log('✅ Project built successfully', 'success');
                    resolve();
                } else {
                    this.log(`❌ Build failed with code ${code}`, 'error');
                    reject(new Error(`Build failed with code ${code}`));
                }
            });
            
            buildProcess.on('error', (error) => {
                this.log(`Build process error: ${error.message}`, 'error');
                reject(error);
            });
        });
    }

    async checkDependencies() {
        this.log('Checking Node.js dependencies...');
        
        try {
            await fs.access(path.join(process.cwd(), 'node_modules'));
            this.log('✅ Node modules found', 'success');
        } catch {
            this.log('Installing Node.js dependencies...');
            await this.installDependencies();
        }
    }

    async installDependencies() {
        return new Promise((resolve, reject) => {
            const installProcess = spawn('npm', ['install'], {
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            installProcess.stdout.on('data', (data) => {
                this.log(`NPM: ${data.toString().trim()}`, 'info');
            });
            
            installProcess.stderr.on('data', (data) => {
                this.log(`NPM: ${data.toString().trim()}`, 'info');
            });
            
            installProcess.on('close', (code) => {
                if (code === 0) {
                    this.log('✅ Dependencies installed successfully', 'success');
                    resolve();
                } else {
                    this.log(`❌ Dependency installation failed with code ${code}`, 'error');
                    reject(new Error(`NPM install failed with code ${code}`));
                }
            });
            
            installProcess.on('error', (error) => {
                this.log(`NPM install error: ${error.message}`, 'error');
                reject(error);
            });
        });
    }

    async isServerRunning(url) {
        try {
            const response = await fetch(url);
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Run analysis
const analyzer = new WebsiteAnalyzer();
analyzer.analyze().catch(console.error);
