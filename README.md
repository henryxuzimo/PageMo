# 网页渲染器

一个实时网页渲染器服务，支持HTML、CSS、JavaScript代码的实时编辑和预览。
也可以支持可以直接将你已经渲染完成的前端页面直接一键发布至你的服务器中。
同时以上的所有功能都有封装好的API接口，开箱即用

## 功能特性

- 🎨 **实时预览**: 左侧编辑代码，右侧实时显示渲染结果
- 📝 **代码编辑器**: 支持HTML、CSS、JavaScript的语法高亮和自动补全
- 🔄 **实时同步**: 使用Socket.IO实现多用户实时同步
- 💾 **代码保存**: 支持保存和加载代码
- 📱 **响应式设计**: 支持桌面和移动设备
- 🎯 **现代化UI**: 美观的毛玻璃效果和渐变背景

## 技术栈

- **后端**: Node.js + Express + Socket.IO
- **前端**: HTML5 + CSS3 + JavaScript
- **代码编辑器**: CodeMirror
- **实时通信**: Socket.IO

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 3. 访问应用

打开浏览器访问: http://localhost:8765

## 使用说明

### 基本操作

1. **编辑代码**: 在左侧的HTML、CSS、JavaScript标签页中编辑代码
2. **实时预览**: 代码修改后，右侧会自动更新预览结果
3. **可视化编辑**: 点击"编辑"按钮进入可视化编辑模式，直接点击页面元素进行编辑
4. **运行代码**: 点击"运行代码"按钮手动刷新预览
5. **保存代码**: 点击"保存代码"按钮，确认后将代码保存为HTML文件并下载
6. **发布网页**: 点击"发布网页"按钮，将网页发布到服务器供他人访问
7. **管理发布**: 点击"已发布"按钮查看和管理已发布的网页
8. **清空代码**: 点击"清空代码"按钮清空所有编辑器

### 快捷键

- `Ctrl + Enter`: 运行代码
- `Ctrl + Space`: 代码自动补全

### 预览控制

- **编辑**: 进入可视化编辑模式，直接点击页面元素进行编辑
- **刷新**: 手动刷新预览窗口
- **全屏**: 将预览窗口切换到全屏模式

## 项目结构

```
web-renderer/
├── server.js          # Express服务器
├── package.json       # 项目配置
├── README.md          # 项目说明
└── public/            # 静态文件
    ├── index.html     # 主页面
    ├── styles.css     # 样式文件
    └── script.js      # 前端脚本
```

## API接口

### GET /api/code
获取当前保存的代码

**响应示例:**
```json
{
  "html": "<h1>Hello World</h1>",
  "css": "body { color: blue; }",
  "javascript": "console.log('Hello');"
}
```

### POST /api/code
保存代码到服务器

**请求体:**
```json
{
  "html": "<h1>Hello World</h1>",
  "css": "body { color: blue; }",
  "javascript": "console.log('Hello');"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "代码已更新"
}
```

### GET /render
渲染指定的代码

**查询参数:**
- `html`: HTML代码
- `css`: CSS代码
- `javascript`: JavaScript代码

### POST /api/download
下载代码为HTML文件

**请求体:**
```json
{
  "html": "<h1>Hello World</h1>",
  "css": "body { color: blue; }",
  "javascript": "console.log('Hello');"
}
```

**响应:** 返回可下载的HTML文件

### POST /api/publish
发布网页到服务器

**请求体:**
```json
{
  "html": "<h1>Hello World</h1>",
  "css": "body { color: blue; }",
  "javascript": "console.log('Hello');",
  "title": "我的网页"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "网页发布成功",
  "url": "http://localhost:8765/published/page_1234567890_abcd.html",
  "fileName": "page_1234567890_abcd.html"
}
```

### GET /api/published
获取已发布的网页列表

**响应示例:**
```json
{
  "success": true,
  "pages": [
    {
      "fileName": "page_1234567890_abcd.html",
      "url": "http://localhost:8765/published/page_1234567890_abcd.html",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "size": 1024
    }
  ]
}
```

### DELETE /api/published/:fileName
删除已发布的网页

**响应示例:**
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

## 开发说明

### 添加新功能

1. 在`public/script.js`中添加前端逻辑
2. 在`server.js`中添加后端API
3. 在`public/styles.css`中添加样式

### 自定义主题

可以通过修改`public/styles.css`中的CSS变量来自定义主题颜色：

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --background-color: #f5f5f5;
}
```

## 故障排除

### 常见问题

1. **端口被占用**: 修改`server.js`中的PORT变量（当前使用8765端口）
2. **依赖安装失败**: 确保Node.js版本 >= 14
3. **预览不更新**: 检查浏览器控制台是否有错误

### 调试模式

启动时添加环境变量来启用调试模式：

```bash
DEBUG=* npm run dev
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

