'use strict';

import test from 'ava';
import customizationResolverWebpackPlugin from '../lib/index.js';

test('awesome:test', t => {
  const message = 'everything is awesome';
  t.is(customizationResolverWebpackPlugin('awesome'), message, message);
});
