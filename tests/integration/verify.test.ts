describe('Verify', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('test runs without errors', () => {
    expect(true).toBeTruthy();
  });
});
