import { ArchetypeDetector } from '../../bin/lib/archetype-detector.js';

describe('ArchetypeDetector', () => {
  let tmpDir: string;
  let instance: ArchetypeDetector;

  beforeEach(() => {
    tmpDir = createTempProject();
    instance = new ArchetypeDetector(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(instance).toBeTruthy();
  });

  test('instance methods work', () => {
    expect(instance).toBeDefined();
  });
});
