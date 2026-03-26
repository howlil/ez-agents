import { StackDetector } from '../../bin/lib/stack-detector.js';

describe('StackDetector', () => {
  let tmpDir: string;
  let instance: StackDetector;

  beforeEach(() => {
    tmpDir = createTempProject();
    instance = new StackDetector(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(instance).toBeTruthy();
  });

  test('instance methods work', () => {
    expect(instance).toBeDefined();
  });
});
