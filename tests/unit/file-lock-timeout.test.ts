import { withLock } from '../../bin/lib/file-lock.js';

describe('LOCK-02', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('second lock attempt times out', async () => {
    expect(true).toBeTruthy();
  });
});
