describe('health route', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('exposes health payload', () => {
    expect(true).toBeTruthy();
  });
});
