# Cosmos 个人博客

个人信息：Cosmos；计算机科学与技术；计算机视觉、图像检索；1335624615@qq.com。

## 使用

直接打开 index.html 可浏览页面。在线托管时将 仓库根目录中的全部文件上传到静态网站服务。GitHub Pages 可将这些文件放在你自己的 用户名.github.io 仓库根目录，设置 Pages 从 main 分支根目录发布。

- 搜索、分类、文章阅读、深色模式均可直接使用。
- 写笔记保存在当前浏览器的本机存储。不会自动同步到 GitHub 或其他设备；清除浏览器数据会丢失记录，请使用“导出全部笔记”备份。
- 导入备份会合并未存在的笔记，相同 id 不覆盖。
- 默认三篇文章均明确标记为示例，可在阅读窗口中删除。
- 如需把新文章展示给所有访客，需要把文章数据加入 app.js 的 seed 数组并重新发布。当前版本没有远程登录发布服务。

## 修改

- index.html：名字、简介、邮箱、页面布局。
- style.css：颜色、布局、响应式样式、原创 CSS 星球图案。
- app.js：默认文章与交互功能。

## 参考

按用户指定查看了 https://github.com/Liufuyingjie/Liufuyingjie.github.io 的公开源码，借鉴博客的横幅、文章列表与侧栏结构。未发现明确 LICENSE；本交付重新编写实现，不复制原仓库代码、文章、照片或后台服务配置。

## 开源许可

网站代码使用 MIT License，详见 LICENSE。

## GitHub 发布

建议仓库名 cosmos-blog，设为 Public。将本目录中的文件提交到 main 分支，在仓库 Settings → Pages 中选择 Deploy from a branch、main、/(root)，保存后等待发布。

公开源码与公开网站是独立设置。此前的 Sites 预览仍保持私人访问。
