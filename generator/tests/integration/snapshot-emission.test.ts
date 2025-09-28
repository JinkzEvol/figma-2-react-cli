import { describe, expect, test } from '@jest/globals';
import { emitComponent } from '../../src/emit';
import type { LayerNode } from '../../src/transform/models';

describe('integration: snapshot emission ordering', () => {
  test('emits deterministic component structure and class ordering', () => {
    const root: LayerNode = {
      id: 'root',
      name: 'Root',
      type: 'FRAME',
      bounds: { x: 0, y: 0, width: 800, height: 600 },
      isIgnored: false,
      children: [
        {
          id: 'child-1',
          name: 'Hero Section',
          type: 'FRAME',
          bounds: { x: 0, y: 0, width: 800, height: 400 },
          isIgnored: false,
          children: [
            {
              id: 'grandchild-1',
              name: 'Heading',
              type: 'TEXT',
              bounds: { x: 0, y: 0, width: 600, height: 120 },
              isIgnored: false,
              children: []
            }
          ]
        },
        {
          id: 'child-2',
          name: 'CTA Button',
          type: 'RECTANGLE',
          bounds: { x: 0, y: 420, width: 200, height: 60 },
          isIgnored: false,
          children: []
        }
      ]
    };

    const classes = ['text-red-500', 'flex', 'gap-[16px]', 'font-bold', 'p-6', 'bg-blue-500', 'tracking-tight'];
    const output = emitComponent({ componentName: 'SnapshotDemo', root, classList: classes });

    expect(output).toMatchSnapshot();
  });
});
