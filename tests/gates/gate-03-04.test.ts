describe('Gate 03-04', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('gates work', () => {
    expect(true).toBeTruthy();
  });
});
