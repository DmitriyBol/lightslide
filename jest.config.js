/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  // e2e specs are *.spec.ts under e2e/ and run by Playwright, not Jest — keep Jest's default
  // testMatch (which would otherwise grab them) out of that folder.
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "\\.(scss|css)$": "identity-obj-proxy",
  },
};
