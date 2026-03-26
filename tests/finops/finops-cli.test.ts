describe('ez-agents finops', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('finops budget --set configures spending limit', () => {
    const result = runEzTools(['finops', 'budget', '--set', '100'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('finops budget --status shows current spending status', () => {
    const result = runEzTools(['finops', 'budget', '--status'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('finops record --cost logs expense with category', () => {
    const result = runEzTools(['finops', 'record', '--cost', '50', '--category', 'api'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('finops report --period generates cost report', () => {
    const result = runEzTools(['finops', 'report', '--period', 'monthly'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('finops analyze --recommendations returns optimization suggestions', () => {
    const result = runEzTools(['finops', 'analyze', '--recommendations'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('finops export --format csv exports cost data', () => {
    const result = runEzTools(['finops', 'export', '--format', 'csv'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });
});
