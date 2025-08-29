const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/published', express.static(path.join(__dirname, 'published')));

// 存储代码数据
let currentCode = {
  html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>我的网页</title>\n</head>\n<body>\n    <h1>欢迎使用网页渲染器！</h1>\n    <p>在左侧编辑代码，右侧将实时显示渲染结果。</p>\n</body>\n</html>',
  css: 'body {\n    font-family: Arial, sans-serif;\n    margin: 40px;\n    background-color: #f5f5f5;\n}\n\nh1 {\n    color: #333;\n    text-align: center;\n}\n\np {\n    color: #666;\n    line-height: 1.6;\n}',
  javascript: '// 在这里编写JavaScript代码\nconsole.log("页面已加载");\n\ndocument.addEventListener("DOMContentLoaded", function() {\n    console.log("DOM加载完成");\n});'
};

// API路由
app.get('/api/code', (req, res) => {
  res.json(currentCode);
});

app.post('/api/code', (req, res) => {
  const { html, css, javascript } = req.body;
  currentCode = { html, css, javascript };
  
  // 通过Socket.IO广播代码更新
  io.emit('codeUpdate', currentCode);
  
  res.json({ success: true, message: '代码已更新' });
});

// 下载代码文件
app.post('/api/download', (req, res) => {
  const { html, css, javascript } = req.body;
  
  // 生成完整的HTML文件内容
  const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的网页</title>
    <style>
${css || ''}
    </style>
</head>
<body>
${html || ''}
    <script>
${javascript || ''}
    </script>
</body>
</html>`;
  
  // 设置响应头
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', 'attachment; filename="webpage.html"');
  
  res.send(fullHTML);
});

// 发布网页到服务器
app.post('/api/publish', (req, res) => {
  try {
    const { html, css, javascript, title = '我的网页' } = req.body;
    
    // 生成唯一的文件名
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(4).toString('hex');
    const fileName = `page_${timestamp}_${randomId}`;
    
    // 生成完整的HTML文件内容
    const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
${css || ''}
    </style>
</head>
<body>
${html || ''}
    <script>
${javascript || ''}
    </script>
</body>
</html>`;
    
    // 确保发布目录存在
    const publishDir = path.join(__dirname, 'published');
    if (!fs.existsSync(publishDir)) {
      fs.mkdirSync(publishDir, { recursive: true });
    }
    
    // 保存文件
    const filePath = path.join(publishDir, `${fileName}.html`);
    fs.writeFileSync(filePath, fullHTML, 'utf8');
    
    // 生成访问URL
    const baseUrl = req.protocol + '://' + req.get('host');
    const publishUrl = `${baseUrl}/published/${fileName}.html`;
    
    res.json({
      success: true,
      message: '网页发布成功',
      url: publishUrl,
      fileName: `${fileName}.html`
    });
    
  } catch (error) {
    console.error('发布失败:', error);
    res.status(500).json({
      success: false,
      message: '发布失败: ' + error.message
    });
  }
});

// 获取已发布的网页列表
app.get('/api/published', (req, res) => {
  try {
    const publishDir = path.join(__dirname, 'published');
    if (!fs.existsSync(publishDir)) {
      return res.json({ success: true, pages: [] });
    }
    
    const files = fs.readdirSync(publishDir);
    const pages = files
      .filter(file => file.endsWith('.html'))
      .map(file => {
        const stats = fs.statSync(path.join(publishDir, file));
        const baseUrl = req.protocol + '://' + req.get('host');
        return {
          fileName: file,
          url: `${baseUrl}/published/${file}`,
          createdAt: stats.birthtime,
          size: stats.size
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, pages });
    
  } catch (error) {
    console.error('获取发布列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取发布列表失败'
    });
  }
});

// 删除已发布的网页
app.delete('/api/published/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
    const publishDir = path.join(__dirname, 'published');
    const filePath = path.join(publishDir, fileName);
    
    // 安全检查：确保文件名只包含字母、数字、下划线和点
    if (!/^[a-zA-Z0-9_.-]+\.html$/.test(fileName)) {
      return res.status(400).json({
        success: false,
        message: '无效的文件名'
      });
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: '文件删除成功' });
    } else {
      res.status(404).json({ success: false, message: '文件不存在' });
    }
    
  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({
      success: false,
      message: '删除文件失败'
    });
  }
});

// Socket.IO连接处理
io.on('connection', (socket) => {
  console.log('用户已连接');
  
  // 发送当前代码给新连接的用户
  socket.emit('codeUpdate', currentCode);
  
  socket.on('disconnect', () => {
    console.log('用户已断开连接');
  });
});

// 渲染页面路由
app.get('/render', (req, res) => {
  const { html, css, javascript } = req.query;
  
  const renderedHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>渲染结果</title>
        <style>${css || ''}</style>
    </head>
    <body>
        ${html || ''}
        <script>${javascript || ''}</script>
    </body>
    </html>
  `;
  
  res.send(renderedHTML);
});

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8765;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`渲染器页面: http://0.0.0.0:${PORT}`);
});
