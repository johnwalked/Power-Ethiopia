/// <reference types="vite/client" />
import type { ThreeElements } from '@react-three/fiber';

declare global {
  const __CE_GEMINI_API_KEY__: string | undefined;

  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}
