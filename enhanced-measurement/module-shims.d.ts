// Type-only fallback declarations for EB 1.21+ pnpm layouts where some editor
// TypeScript services cannot resolve these packages through symlinks. When the
// editor CAN resolve the real packages, these ambient declarations are unused
// and the real types win. Webpack ignores .d.ts files entirely, so shipping
// this file changes nothing at runtime.
declare module '@turf/turf' {
    const turf: any;
    export = turf;
}
declare module 'jspdf' {
    const jsPDF: any;
    export default jsPDF;
}
