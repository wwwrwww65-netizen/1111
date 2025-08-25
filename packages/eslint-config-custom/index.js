module.exports = {
  extends: ["next", "turbo", "prettier"],
  plugins: ["turbo"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "off",
  },
};
