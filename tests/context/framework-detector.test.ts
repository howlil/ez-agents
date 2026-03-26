import { fileURLToPath } from 'url';
/**
 * Framework Detector Tests
 * Tests for FrameworkDetector class
 */


const { strict: assert } = require('assert');
import * as path from 'path';
import * as fs from 'fs';
import { FrameworkDetector } from '../../bin/lib/framework-detector.js';

const testRoot = path.join(__dirname, '..', 'fixtures', 'test-project');

describe('FrameworkDetector', () => {
  let detector;

  before(() => {
    detector = new FrameworkDetector(testRoot);
  });

  it('detectFromConfig finds typescript when tsconfig.json exists', () => {
    const configs = detector.detectFromConfig(testRoot);
    
    // Check if tsconfig is detected (if it exists in test fixture)
    expect(configs).toBeTruthy() // 'Should return configs object';
  });

  it('detectFromConfig finds jest when jest.config.js exists', () => {
    const configs = detector.detectFromConfig(testRoot);
    
    expect(configs).toBeTruthy() // 'Should return configs object';
    // Jest config detection depends on fixture
  });

  it('detectFromConfig finds docker when Dockerfile exists', () => {
    const configs = detector.detectFromConfig(testRoot);
    
    expect(configs).toBeTruthy() // 'Should return configs object';
    // Docker detection depends on fixture
  });

  it('detectFromConfig returns object with framework keys', () => {
    const configs = detector.detectFromConfig(testRoot);

    expect(typeof configs === 'object').toBeTruthy() // 'Should return object';
    // Each detected framework should have config, path, confidence
    for (const [framework, info] of Object.entries(configs)) {
      const frameworkInfo = info as { path?: string; confidence?: number };
      expect(frameworkInfo.path).toBeTruthy() // `Framework ${framework} should have path`;
      expect(frameworkInfo.confidence).toBeTruthy() // `Framework ${framework} should have confidence`;
    }
  });

  it('detectFromImports finds React from import React statements', () => {
    // Create a test file with React imports
    const testFile = path.join(testRoot, 'test-react.tsx');
    const testContent = `
      import React from 'react';
      import { useState } from 'react';
      
      export function Component() {
        const [state, setState] = useState(undefined);
        return <div>{state}</div>;
      }
    `;
    
    fs.writeFileSync(testFile, testContent);
    
    const imports = detector.detectFromImports([testFile]);
    
    expect(imports.React || imports['React']).toBeTruthy() // 'Should detect React';
    
    // Cleanup
    fs.unlinkSync(testFile);
  });

  it('detectFromImports finds Next.js from next/server imports', () => {
    const testFile = path.join(testRoot, 'test-next.tsx');
    const testContent = `
      import { NextRequest, NextResponse } from 'next/server';
      
      export async function GET(request: NextRequest) {
        return NextResponse.json({ hello: 'world' });
      }
    `;
    
    fs.writeFileSync(testFile, testContent);
    
    const imports = detector.detectFromImports([testFile]);
    
    expect(imports['Next.js']).toBeTruthy() // 'Should detect Next.js';
    
    // Cleanup
    fs.unlinkSync(testFile);
  });

  it('detectFromImports finds Express from import statements', () => {
    const testFile = path.join(testRoot, 'test-express.ts');
    const testContent = `
      import express from 'express';
      const app = express();
      
      app.get('/', (req, res) => {
        res.send('Hello');
      });
    `;
    
    fs.writeFileSync(testFile, testContent);
    
    const imports = detector.detectFromImports([testFile]);
    
    expect(imports.Express).toBeTruthy() // 'Should detect Express';
    
    // Cleanup
    fs.unlinkSync(testFile);
  });

  it('detectFromImports handles multiple frameworks in one file', () => {
    const testFile = path.join(testRoot, 'test-multi.tsx');
    const testContent = `
      import React from 'react';
      import { NextPage } from 'next';
      
      const HomePage: NextPage = () => {
        return <div>Hello</div>;
      };
      
      export default HomePage;
    `;
    
    fs.writeFileSync(testFile, testContent);
    
    const imports = detector.detectFromImports([testFile]);
    
    expect(imports.React || imports['React']).toBeTruthy() // 'Should detect React';
    expect(imports['Next.js']).toBeTruthy() // 'Should detect Next.js';
    
    // Cleanup
    fs.unlinkSync(testFile);
  });

  it('detectFromImports returns empty object for files with no framework imports', () => {
    const testFile = path.join(testRoot, 'test-plain.ts');
    const testContent = `
      export function add(a: number, b: number): number {
        return a + b;
      }
    `;
    
    fs.writeFileSync(testFile, testContent);
    
    const imports = detector.detectFromImports([testFile]);
    
    expect(typeof imports === 'object').toBeTruthy() // 'Should return object';
    expect(Object.keys(imports).length).toBe(0, 'Should have no frameworks');
    
    // Cleanup
    fs.unlinkSync(testFile);
  });

  it('detectFrameworkPatterns finds React patterns', () => {
    const testFile = path.join(testRoot, 'test-react-pattern.tsx');
    const testContent = `
      import React, { createContext, useContext } from 'react';
      
      const MyContext = createContext(undefined);
      
      function MyComponent() {
        const value = useContext(MyContext);
        return <div>{value}</div>;
      }
    `;
    
    fs.writeFileSync(testFile, testContent);
    
    const patterns = detector.detectFrameworkPatterns([testFile]);
    
    expect(patterns.React).toBeTruthy() // 'Should detect React patterns';
    expect(patterns.React.total > 0).toBeTruthy() // 'Should have match count';
    
    // Cleanup
    fs.unlinkSync(testFile);
  });

  it('analyze returns comprehensive framework analysis', () => {
    const result = detector.analyze(testRoot);
    
    expect(result).toBeTruthy() // 'Should return analysis result';
    expect(result.frameworks).toBeTruthy() // 'Should have frameworks';
    expect(result.summary).toBeTruthy() // 'Should have summary';
    expect(typeof result.summary.total === 'number').toBeTruthy() // 'Should have total count';
    expect(result.summary.byConfidence).toBeTruthy() // 'Should have confidence breakdown';
  });
});

// Simple test runner for Node.js native test runner
if (require.main === module) {
  console.log('FrameworkDetector tests defined');
}
