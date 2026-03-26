describe('ContextErrors', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('test runs', () => {
    expect(true).toBeTruthy();
  });
});
