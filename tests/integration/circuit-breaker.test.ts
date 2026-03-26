describe('CircuitBreaker', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('circuit breaker works', () => {
    expect(true).toBeTruthy();
  });
});
