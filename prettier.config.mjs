/** @type {import("prettier").Config} */
export default {
  // 100 instead of 80: TypeScript types make lines long, and wrapping them
  // early would make our 50-line functions reach the limit sooner.
  printWidth: 100,
};
