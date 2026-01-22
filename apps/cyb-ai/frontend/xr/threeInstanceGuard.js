if (typeof window !== 'undefined') {
  if (window.__THREE__) {
    console.warn('WARNING: Multiple instances of Three.js being imported.');
  } else {
    window.__THREE__ = 'REVISION';
  }
}
