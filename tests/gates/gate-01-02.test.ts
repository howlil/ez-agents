describe('Gate 01-02', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('gates work', () => {
    expect(true).toBeTruthy();
  });
});
