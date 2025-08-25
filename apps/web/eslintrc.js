/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["custom", "next/core-web-vitals"],
  rules: {
    "no-console": "warn",
  },
};
