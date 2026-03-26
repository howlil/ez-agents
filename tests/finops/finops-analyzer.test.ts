import { FinopsAnalyzer } from '../../bin/lib/finops/finops-analyzer.js';

describe('FinopsAnalyzer', () => {
  let tmpDir: string;
  let instance: FinopsAnalyzer;

  beforeEach(() => {
    tmpDir = createTempProject();
    instance = new FinopsAnalyzer(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(instance).toBeTruthy();
  });

  test('methods work', async () => {
    const result = await instance.analyzeCosts();
    expect(result !== undefined).toBeTruthy();
  });
});
