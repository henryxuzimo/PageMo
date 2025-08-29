#!/bin/bash

# PageMo 服务管理脚本
SERVICE_NAME="pagemo-server"
CONFIG_FILE="ecosystem.config.js"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 显示帮助信息
show_help() {
    echo "PageMo 服务管理脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start    启动服务"
    echo "  stop     停止服务"
    echo "  restart  重启服务"
    echo "  status   查看服务状态"
    echo "  logs     查看服务日志"
    echo "  monitor  实时监控"
    echo "  help     显示此帮助信息"
    echo ""
}

# 启动服务
start_service() {
    print_message $BLUE "正在启动 PageMo 服务..."
    if pm2 start "$CONFIG_FILE"; then
        print_message $GREEN "服务启动成功！"
        print_message $BLUE "访问地址: http://172.21.9.163:8765"
    else
        print_message $RED "服务启动失败！"
        return 1
    fi
}

# 停止服务
stop_service() {
    print_message $YELLOW "正在停止 PageMo 服务..."
    if pm2 stop "$SERVICE_NAME"; then
        print_message $GREEN "服务已停止！"
    else
        print_message $RED "停止服务失败！"
        return 1
    fi
}

# 重启服务
restart_service() {
    print_message $BLUE "正在重启 PageMo 服务..."
    if pm2 restart "$SERVICE_NAME"; then
        print_message $GREEN "服务重启成功！"
    else
        print_message $RED "服务重启失败！"
        return 1
    fi
}

# 查看服务状态
show_status() {
    print_message $BLUE "PageMo 服务状态:"
    echo ""
    pm2 status
    echo ""
    print_message $BLUE "端口监听状态:"
    netstat -tlnp | grep 8765 || echo "端口 8765 未监听"
    echo ""
    print_message $BLUE "HTTP 响应测试:"
    if curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost:8765; then
        print_message $GREEN "HTTP 响应正常"
    else
        print_message $RED "HTTP 响应异常"
    fi
}

# 查看服务日志
show_logs() {
    print_message $BLUE "显示最近的日志 (按 Ctrl+C 退出):"
    pm2 logs "$SERVICE_NAME" --lines 50
}

# 实时监控
monitor_service() {
    print_message $BLUE "启动实时监控 (按 Ctrl+C 退出):"
    pm2 monit
}

# 主函数
main() {
    case "$1" in
        start)
            start_service
            ;;
        stop)
            stop_service
            ;;
        restart)
            restart_service
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        monitor)
            monitor_service
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_message $RED "错误: 未知命令 '$1'"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 检查是否在正确的目录
if [ ! -f "$CONFIG_FILE" ]; then
    print_message $RED "错误: 请在 PageMo 项目目录中运行此脚本"
    exit 1
fi

# 执行主函数
main "$@"
