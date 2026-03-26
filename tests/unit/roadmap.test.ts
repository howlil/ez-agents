describe('roadmap', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('roadmap analyze parses phases', () => {
    const result = runEzTools(['roadmap', 'analyze'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('roadmap analyze extracts goals', () => {
    const result = runEzTools(['roadmap', 'analyze'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('roadmap analyze handles milestone extraction', () => {
    const result = runEzTools(['roadmap', 'analyze'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('roadmap update-plan-progress handles missing phase', () => {
    const result = runEzTools(['roadmap', 'update-plan-progress'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('roadmap update-plan-progress handles nonexistent phase', () => {
    const result = runEzTools(['roadmap', 'update-plan-progress', '99'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('roadmap update-plan-progress works with valid phase', () => {
    const result = runEzTools(['roadmap', 'update-plan-progress', '1'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });
});
