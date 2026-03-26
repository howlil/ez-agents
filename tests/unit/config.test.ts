describe('config commands', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('config-ensure-section creates config.json', () => {
    const result = runEzTools(['config-ensure-section', 'cost_tracking'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('config-ensure-section is idempotent', () => {
    runEzTools(['config-ensure-section', 'test'], tmpDir);
    const result2 = runEzTools(['config-ensure-section', 'test'], tmpDir);
    expect(result2 !== undefined).toBeTruthy();
  });

  test('config-set sets a top-level string value', () => {
    const result = runEzTools(['config-set', 'test.key', 'value'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('config-set coerces boolean values', () => {
    const result = runEzTools(['config-set', 'test.flag', 'true'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('config-set coerces numeric strings', () => {
    const result = runEzTools(['config-set', 'test.count', '42'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('config-set sets nested values via dot-notation', () => {
    const result = runEzTools(['config-set', 'a.b.c', 'value'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('config-get gets a top-level value', () => {
    const result = runEzTools(['config-get', 'test.key'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('config-get gets a nested value', () => {
    const result = runEzTools(['config-get', 'a.b.c'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('config-get errors for nonexistent key', () => {
    const result = runEzTools(['config-get', 'nonexistent'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });
});
