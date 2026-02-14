import { TextDecoder, TextEncoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  // @ts-expect-error Node util implementation is compatible with browser API used in tests
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  // @ts-expect-error Node util implementation is compatible with browser API used in tests
  global.TextDecoder = TextDecoder;
}
