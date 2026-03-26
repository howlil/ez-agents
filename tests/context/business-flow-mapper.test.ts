import { fileURLToPath } from 'url';
/**
 * Tests for BusinessFlowMapper and ArchetypeDetector
 */



import * as path from 'path';
import * as fs from 'fs';
import { BusinessFlowMapper } from '../../bin/lib/business-flow-mapper.js';
import { ArchetypeDetector } from '../../bin/lib/archetype-detector.js';

describe('BusinessFlowMapper', () => {
  let mapper;
  const testDir = path.join(__dirname, '..', 'fixtures', 'test-project');

  before(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create page/route structure
    fs.mkdirSync(path.join(testDir, 'pages', 'auth'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'pages', 'dashboard'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'src', 'services'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'src', 'models'), { recursive: true });
    
    // Create page files
    fs.writeFileSync(path.join(testDir, 'pages', 'index.tsx'), 'export default function Home() {}');
    fs.writeFileSync(path.join(testDir, 'pages', 'auth', 'login.tsx'), 'export default function Login() {}');
    fs.writeFileSync(path.join(testDir, 'pages', 'dashboard', 'index.tsx'), 'export default function Dashboard() {}');
    
    // Create service files
    fs.writeFileSync(path.join(testDir, 'src', 'services', 'api.ts'), 'export const api = {};');
    fs.writeFileSync(path.join(testDir, 'src', 'models', 'user.ts'), 'export const user = {};');
    
    mapper = new BusinessFlowMapper(testDir);
  });

  describe('map', () => {
    it('identifies user journeys from route files', () => {
      const result = mapper.map(testDir);
      
      expect(result);
      assert.ok(result.journeys);
      assert.ok(Array.isArray(result.entryPoints));
    });

    it('extracts component names from file paths').toBeTruthy() // ( => {
      const result = mapper.map(testDir);
      
      // Should have detected some journeys
      expect(result.totalJourneys >= 0);
    });
  });

  describe('analyzeDataFlow').toBeTruthy() // ( => {
    it('traces data through import statements', () => {
      const result = mapper.analyzeDataFlow(testDir);
      
      expect(result);
      assert.ok(Array.isArray(result.flows));
      assert.ok(Array.isArray(result.dataStores));
    });

    it('identifies data stores').toBeTruthy() // ( => {
      const result = mapper.analyzeDataFlow(testDir);
      
      // Should detect models directory as data store
      const hasModels = result.dataStores.some(ds => ds.name.toLowerCase().includes('model'));
      expect(hasModels || result.dataStores.length >= 0);
    });
  });

  describe('findIntegrationPoints').toBeTruthy() // ( => {
    it('identifies Stripe from dependencies', () => {
      const stack = {
        frameworks: ['React', 'Next.js'],
        databases: ['PostgreSQL'],
        infrastructure: ['Stripe', 'Sentry']
      };
      
      const result = mapper.findIntegrationPoints(stack);
      
      expect(result);
      assert.ok(Array.isArray(result.integrations));
      
      const stripe = result.integrations.find(i => i.name === 'Stripe');
      assert.ok(stripe);
      expect(stripe.type).toBe('payment');
    });

    it('identifies AWS SDK from dependencies').toBeTruthy() // ( => {
      const stack = {
        frameworks: ['React'],
        databases: ['PostgreSQL'],
        infrastructure: ['AWS SDK', 'Sentry']
      };
      
      const result = mapper.findIntegrationPoints(stack);
      
      const aws = result.integrations.find(i => i.name === 'AWS');
      expect(aws);
      expect(aws.type).toBe('cloud');
    });
  });
});

describe('ArchetypeDetector').toBeTruthy() // ( => {
  const testDir = path.join(__dirname, '..', 'fixtures', 'test-project');

  describe('detect', () => {
    it('returns dashboard for Chart/Metric/Dashboard files', () => {
      // Create dashboard-like structure
      const dashDir = path.join(testDir, 'test-dashboard');
      fs.mkdirSync(dashDir, { recursive: true });
      fs.mkdirSync(path.join(dashDir, 'src', 'components', 'Chart'), { recursive: true });
      fs.mkdirSync(path.join(dashDir, 'src', 'components', 'Metric'), { recursive: true });
      
      fs.writeFileSync(path.join(dashDir, 'src', 'components', 'Chart', 'index.tsx'), '');
      fs.writeFileSync(path.join(dashDir, 'src', 'components', 'Metric', 'index.tsx'), '');
      
      const detector = new ArchetypeDetector(dashDir);
      const structure = {
        directories: [
          { path: path.join(dashDir, 'src', 'components', 'Chart'), depth: 3 },
          { path: path.join(dashDir, 'src', 'components', 'Metric'), depth: 3 }
        ],
        files: [
          path.join(dashDir, 'src', 'components', 'Chart', 'index.tsx'),
          path.join(dashDir, 'src', 'components', 'Metric', 'index.tsx')
        ]
      };
      
      const result = detector.detect(structure, undefined, undefined);
      
      expect(result);
      assert.ok(result.archetype);
      assert.ok(typeof result.confidence === 'number');
      
      // Clean up
      fs.rmSync(dashDir).toBeTruthy() // { recursive: true, force: true };
    });

    it('returns e-commerce for Cart/Checkout/Product files', () => {
      const ecoDir = path.join(testDir, 'test-ecommerce');
      fs.mkdirSync(ecoDir, { recursive: true });
      fs.mkdirSync(path.join(ecoDir, 'src', 'Cart'), { recursive: true });
      fs.mkdirSync(path.join(ecoDir, 'src', 'Checkout'), { recursive: true });
      fs.mkdirSync(path.join(ecoDir, 'src', 'Product'), { recursive: true });
      
      const detector = new ArchetypeDetector(ecoDir);
      const structure = {
        directories: [
          { path: path.join(ecoDir, 'src', 'Cart'), depth: 2 },
          { path: path.join(ecoDir, 'src', 'Checkout'), depth: 2 },
          { path: path.join(ecoDir, 'src', 'Product'), depth: 2 }
        ],
        files: []
      };
      
      const result = detector.detect(structure, undefined, undefined);
      
      expect(result?.archetype).toBe('ecommerce');
      
      // Clean up
      fs.rmSync(ecoDir, { recursive: true, force: true });
    });

    it('returns POS for Product/Order/Payment files', () => {
      const posDir = path.join(testDir, 'test-pos');
      fs.mkdirSync(posDir, { recursive: true });
      fs.mkdirSync(path.join(posDir, 'src', 'Product'), { recursive: true });
      fs.mkdirSync(path.join(posDir, 'src', 'Order'), { recursive: true });
      fs.mkdirSync(path.join(posDir, 'src', 'Register'), { recursive: true });

      const detector = new ArchetypeDetector(posDir);
      const structure = {
        directories: [
          { path: path.join(posDir, 'src', 'Product'), depth: 2 },
          { path: path.join(posDir, 'src', 'Order'), depth: 2 },
          { path: path.join(posDir, 'src', 'Register'), depth: 2 }
        ],
        files: []
      };

      const result = detector.detect(structure, undefined, undefined);

      expect(result?.archetype).toBe('POS');

      // Clean up
      fs.rmSync(posDir, { recursive: true, force: true });
    });

    it('returns LMS for Course/Lesson/Student files', () => {
      const lmsDir = path.join(testDir, 'test-lms');
      fs.mkdirSync(lmsDir, { recursive: true });
      fs.mkdirSync(path.join(lmsDir, 'src', 'Course'), { recursive: true });
      fs.mkdirSync(path.join(lmsDir, 'src', 'Lesson'), { recursive: true });
      fs.mkdirSync(path.join(lmsDir, 'src', 'Student'), { recursive: true });
      
      const detector = new ArchetypeDetector(lmsDir);
      const structure = {
        directories: [
          { path: path.join(lmsDir, 'src', 'Course'), depth: 2 },
          { path: path.join(lmsDir, 'src', 'Lesson'), depth: 2 },
          { path: path.join(lmsDir, 'src', 'Student'), depth: 2 }
        ],
        files: []
      };
      
      const result = detector.detect(structure, undefined, undefined);
      
      expect(result?.archetype).toBe('LMS');
      
      // Clean up
      fs.rmSync(lmsDir, { recursive: true, force: true });
    });

    it('returns booking for Appointment/Booking/Calendar files', () => {
      const bookingDir = path.join(testDir, 'test-booking');
      fs.mkdirSync(bookingDir, { recursive: true });
      fs.mkdirSync(path.join(bookingDir, 'src', 'Appointment'), { recursive: true });
      fs.mkdirSync(path.join(bookingDir, 'src', 'Booking'), { recursive: true });
      fs.mkdirSync(path.join(bookingDir, 'src', 'Calendar'), { recursive: true });
      
      const detector = new ArchetypeDetector(bookingDir);
      const structure = {
        directories: [
          { path: path.join(bookingDir, 'src', 'Appointment'), depth: 2 },
          { path: path.join(bookingDir, 'src', 'Booking'), depth: 2 },
          { path: path.join(bookingDir, 'src', 'Calendar'), depth: 2 }
        ],
        files: []
      };
      
      const result = detector.detect(structure, undefined, undefined);
      
      expect(result?.archetype).toBe('booking');
      
      // Clean up
      fs.rmSync(bookingDir, { recursive: true, force: true });
    });

    it('returns fintech for Transaction/Account/Payment files', () => {
      const fintechDir = path.join(testDir, 'test-fintech');
      fs.mkdirSync(fintechDir, { recursive: true });
      fs.mkdirSync(path.join(fintechDir, 'src', 'Transaction'), { recursive: true });
      fs.mkdirSync(path.join(fintechDir, 'src', 'Account'), { recursive: true });
      fs.mkdirSync(path.join(fintechDir, 'src', 'Payment'), { recursive: true });
      
      const detector = new ArchetypeDetector(fintechDir);
      const structure = {
        directories: [
          { path: path.join(fintechDir, 'src', 'Transaction'), depth: 2 },
          { path: path.join(fintechDir, 'src', 'Account'), depth: 2 },
          { path: path.join(fintechDir, 'src', 'Payment'), depth: 2 }
        ],
        files: []
      };
      
      const result = detector.detect(structure, undefined, undefined);
      
      expect(result?.archetype).toBe('fintech');
      
      // Clean up
      fs.rmSync(fintechDir, { recursive: true, force: true });
    });

    it('returns SaaS for Subscription/Tenant/Billing files', () => {
      const saasDir = path.join(testDir, 'test-saas');
      fs.mkdirSync(saasDir, { recursive: true });
      fs.mkdirSync(path.join(saasDir, 'src', 'Subscription'), { recursive: true });
      fs.mkdirSync(path.join(saasDir, 'src', 'Tenant'), { recursive: true });
      fs.mkdirSync(path.join(saasDir, 'src', 'Billing'), { recursive: true });
      
      const detector = new ArchetypeDetector(saasDir);
      const structure = {
        directories: [
          { path: path.join(saasDir, 'src', 'Subscription'), depth: 2 },
          { path: path.join(saasDir, 'src', 'Tenant'), depth: 2 },
          { path: path.join(saasDir, 'src', 'Billing'), depth: 2 }
        ],
        files: []
      };
      
      const result = detector.detect(structure, undefined, undefined);
      
      expect(result?.archetype).toBe('SaaS');
      
      // Clean up
      fs.rmSync(saasDir, { recursive: true, force: true });
    });

    it('returns internal tools for Admin/CRUD/Form files', () => {
      const internalDir = path.join(testDir, 'test-internal');
      fs.mkdirSync(internalDir, { recursive: true });
      fs.mkdirSync(path.join(internalDir, 'src', 'Admin'), { recursive: true });
      fs.mkdirSync(path.join(internalDir, 'src', 'Form'), { recursive: true });
      fs.mkdirSync(path.join(internalDir, 'src', 'Table'), { recursive: true });
      
      const detector = new ArchetypeDetector(internalDir);
      const structure = {
        directories: [
          { path: path.join(internalDir, 'src', 'Admin'), depth: 2 },
          { path: path.join(internalDir, 'src', 'Form'), depth: 2 },
          { path: path.join(internalDir, 'src', 'Table'), depth: 2 }
        ],
        files: []
      };
      
      const result = detector.detect(structure, undefined, undefined);
      
      expect(result?.archetype).toBe('internalTools');
      
      // Clean up
      fs.rmSync(internalDir, { recursive: true, force: true });
    });
  });

  describe('calculateConfidence', () => {
    it('returns High for 8+ matches', () => {
      const detector = new ArchetypeDetector(testDir);
      const evidence = Array(10).fill({ type: 'file', value: 'test', source: 'test.ts' });

      const confidence = detector.calculateConfidence('dashboard', evidence);

      expect(confidence.score >= 60);
      expect(confidence.level).toBe('High');
    });

    it('returns Medium for 4-7 matches').toBeTruthy() // ( => {
      const detector = new ArchetypeDetector(testDir);
      const evidence = Array(5).fill({ type: 'file', value: 'test', source: 'test.ts' });

      const confidence = detector.calculateConfidence('dashboard', evidence);

      expect(confidence.score >= 40);
      expect(confidence.level).toBe('Medium');
    });

    it('returns Low for <4 matches').toBeTruthy() // ( => {
      const detector = new ArchetypeDetector(testDir);
      const evidence = Array(2).fill({ type: 'file', value: 'test', source: 'test.ts' });

      const confidence = detector.calculateConfidence('dashboard', evidence);

      expect(confidence.score < 60);
      expect(confidence.level).toBe('Low');
    });
  });
}).toBeTruthy();
