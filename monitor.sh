#!/bin/bash

# PageMo 服务监控脚本
LOG_FILE="/home/it/PageMo/logs/monitor.log"
SERVICE_NAME="pagemo-server"
PORT=8765

# 记录日志函数
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# 检查服务是否运行
check_service() {
    if pm2 list | grep -q "$SERVICE_NAME.*online"; then
        return 0
    else
        return 1
    fi
}

# 检查端口是否监听
check_port() {
    if netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
        return 0
    else
        return 1
    fi
}

# 检查HTTP响应
check_http() {
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200"; then
        return 0
    else
        return 1
    fi
}

# 重启服务
restart_service() {
    log "重启服务 $SERVICE_NAME"
    pm2 restart "$SERVICE_NAME"
    sleep 5
}

# 主监控逻辑
main() {
    log "开始监控检查"
    
    # 检查PM2服务状态
    if ! check_service; then
        log "警告: PM2服务 $SERVICE_NAME 不在线，尝试重启"
        restart_service
        if ! check_service; then
            log "错误: 重启失败，服务仍然离线"
            return 1
        fi
    fi
    
    # 检查端口监听
    if ! check_port; then
        log "警告: 端口 $PORT 未监听，尝试重启服务"
        restart_service
        if ! check_port; then
            log "错误: 端口 $PORT 仍然未监听"
            return 1
        fi
    fi
    
    # 检查HTTP响应
    if ! check_http; then
        log "警告: HTTP响应异常，尝试重启服务"
        restart_service
        if ! check_http; then
            log "错误: HTTP响应仍然异常"
            return 1
        fi
    fi
    
    log "监控检查完成，服务运行正常"
    return 0
}

# 执行监控
main
