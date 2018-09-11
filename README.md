# uke web server

-----

## 依赖

- node
- babel 7

-----

## 提供的功能

1. 提供一个通用的、快速搭建 web server 的脚手架
2. 提供服务（server）注册和动态加载路由（router）的机制
3. 前端资源版本管理，以及资源的权限管理
4. 测试用的权限

-----

## [基本结构](./docs/structure.md)

-----

## 开始使用

### 自动构建

安装构建工具 uke-cli

```shell
npm i uke-cli -g
```

### 更新

TODO

### 手动使用

```shell
git clone https://github.com/SANGET/orion-web-server.git yourProjName
cd ./yourProjName
npm run init
npm start // 使用 nodemon
```

### 部署

TODO

-----

## 域名绑定

可以使用 nginx 设置二级域名制定特定的 web server，例如动态路由 dyr.host.com -> host.com/dyr（dyr 为 dynamic-routers 的简称），所有已添加的动态路由都可以通过 dyr.host.com/your-router 访问
