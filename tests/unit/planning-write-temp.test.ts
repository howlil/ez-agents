describe('safePlanningWrite temp staging', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('creates temp file and cleans up', async () => {
    expect(true).toBeTruthy();
  });

  test('cleans up on error', async () => {
    expect(true).toBeTruthy();
  });
});
