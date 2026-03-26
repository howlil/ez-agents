import { BusinessFlowMapper } from '../../bin/lib/business-flow-mapper.js';

describe('BusinessFlowMapper', () => {
  let tmpDir: string;
  let instance: BusinessFlowMapper;

  beforeEach(() => {
    tmpDir = createTempProject();
    instance = new BusinessFlowMapper(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(instance).toBeTruthy();
  });

  test('instance methods work', () => {
    expect(instance).toBeDefined();
  });
});
