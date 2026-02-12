import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const CanvasMock = ({ children, ...rest }) => React.createElement('canvas', rest, children);

test('Canvas3D renders a canvas element when WebGL is available', async () => {
  const { Canvas3D } = await import('../src/three/Canvas3D.tsx');
  const html = renderToStaticMarkup(
    React.createElement(
      Canvas3D,
      { CanvasComponent: CanvasMock },
      React.createElement('span', null, 'placeholder')
    )
  );
  assert.ok(html.includes('<canvas'));
});
