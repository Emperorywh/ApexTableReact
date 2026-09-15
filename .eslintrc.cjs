/*
 * 包采用标准 ESM，ESLint 8 的 CommonJS 配置改用明确扩展名。
 * 保留现有规则，不自动格式化项目源码。
 */
module.exports = {
  extends: require.resolve('@umijs/lint/dist/config/eslint'),
};
