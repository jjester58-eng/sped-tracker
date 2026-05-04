// types/globals.d.ts

// CSS Modules / Global CSS support for Next.js + TypeScript
declare module '*.css' {
  const content: string;
  export default content;
}