import { defineConfig } from 'dumi';

export default defineConfig({
  /*
   * 文档沿用 dumi，示例引用正式源码并与运行时包分离。
   * 页面文案默认中文，组件名仍保留项目既有名称。
   */
  outputPath: 'docs-dist',
  themeConfig: {
    name: 'ApexTableReact',
  },
});
