# PageMo 服务管理指南

## 概述

PageMo 服务现在使用 PM2 进程管理器来确保高可用性和稳定性。本指南介绍如何管理和监控服务。

## 快速开始

### 1. 服务管理脚本

使用 `service-manager.sh` 脚本来管理服务：

```bash
# 查看服务状态
./service-manager.sh status

# 启动服务
./service-manager.sh start

# 停止服务
./service-manager.sh stop

# 重启服务
./service-manager.sh restart

# 查看日志
./service-manager.sh logs

# 实时监控
./service-manager.sh monitor

# 显示帮助
./service-manager.sh help
```

### 2. PM2 直接命令

```bash
# 查看所有进程状态
pm2 status

# 查看日志
pm2 logs pagemo-server

# 重启服务
pm2 restart pagemo-server

# 停止服务
pm2 stop pagemo-server

# 删除服务
pm2 delete pagemo-server

# 实时监控
pm2 monit
```

## 自动恢复功能

### 1. 开机自启动
服务已配置为开机自动启动，无需手动干预。

### 2. 自动重启
- 服务崩溃时自动重启
- 内存使用超过 1GB 时自动重启
- 最多重启 10 次，每次间隔 4 秒

### 3. 定时监控
每 5 分钟自动检查服务状态，发现问题时自动重启。

## 日志管理

### 日志文件位置
- 错误日志：`./logs/err.log`
- 输出日志：`./logs/out.log`
- 合并日志：`./logs/combined.log`
- 监控日志：`./logs/monitor.log`

### 查看日志
```bash
# 查看 PM2 日志
pm2 logs pagemo-server

# 查看监控日志
tail -f logs/monitor.log

# 查看错误日志
tail -f logs/err.log
```

## 故障排除

### 1. 服务无法启动
```bash
# 检查端口是否被占用
netstat -tlnp | grep 8765

# 检查 PM2 状态
pm2 status

# 查看详细错误日志
pm2 logs pagemo-server --err
```

### 2. 服务频繁重启
```bash
# 查看重启次数
pm2 status

# 检查内存使用
pm2 monit

# 查看系统资源
top
```

### 3. 网络连接问题
```bash
# 测试本地连接
curl http://localhost:8765

# 测试外部连接
curl http://172.21.9.163:8765

# 检查防火墙
sudo iptables -L | grep 8765
```

## 配置说明

### PM2 配置文件 (ecosystem.config.js)
- `autorestart: true` - 自动重启
- `max_memory_restart: '1G'` - 内存限制
- `max_restarts: 10` - 最大重启次数
- `restart_delay: 4000` - 重启延迟
- `wait_ready: true` - 等待服务就绪

### 监控脚本 (monitor.sh)
- 每 5 分钟检查一次
- 检查 PM2 状态、端口监听、HTTP 响应
- 发现问题时自动重启

## 访问地址

- 本地访问：http://localhost:8765
- 外部访问：http://172.21.9.163:8765

## 注意事项

1. **不要手动终止 PM2 进程**：使用 `pm2 stop` 或 `./service-manager.sh stop`
2. **定期检查日志**：关注错误日志和监控日志
3. **备份配置**：定期备份 `ecosystem.config.js` 和脚本文件
4. **系统重启**：服务会自动恢复，无需手动干预

## 联系支持

如果遇到问题，请检查：
1. 服务状态：`./service-manager.sh status`
2. 错误日志：`pm2 logs pagemo-server --err`
3. 监控日志：`tail -f logs/monitor.log`
