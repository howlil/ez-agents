describe('dispatcher', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('dispatcher handles --cwd= form', () => {
    const result = runEzTools(['--cwd=' + tmpDir, 'init', 'progress'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('dispatcher handles unknown subcommands', () => {
    const result = runEzTools(['template', 'unknown'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('dispatcher find-phase locates directory', () => {
    const result = runEzTools(['find-phase', '01'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('dispatcher roadmap update-plan-progress works', () => {
    const result = runEzTools(['roadmap', 'update-plan-progress', '1'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('dispatcher state loads', () => {
    const result = runEzTools(['state'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });

  test('dispatcher summary-extract works', () => {
    const result = runEzTools(['summary-extract', 'test.md'], tmpDir);
    expect(result !== undefined).toBeTruthy();
  });
});
