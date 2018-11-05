# uke web server

[![Build Status](https://travis-ci.org/SANGET/uke-web-server.svg?branch=master)](https://travis-ci.org/SANGET/uke-web-server)

两层结构

- system 系统服务，可以开启新服务
- runtme 运行时服务，挂载动态路由，和运行时文件

-----

## 依赖

- node > 10
- babel 7
- pm2

```shell
# 安装 nvm
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash

# source .bashrc
. ~/.bashrc

# 安装 node stable
nvm install stable

# pm2
npm i pm2 -g
```

-----

## 提供的功能

1. 提供一个通用的、快速搭建 web server 的脚手架
2. 提供 system 系统服务，和 runtime 运行时动态路由机制
3. 前端资源版本管理，资源的权限管理
4. 简易的权限

- [基本结构](./docs/structure.md)

-----

## 开始使用

### 接口

> servers，提供了注册在 Main server 的路由，或者注册一个全新服务的接口

注册到 Main server 上

```js

```

注册全新服务

1. 在 system/servers 下创建任意目录，并且需要有 index.js 索引文件
2. index.js 到处 start 方法作为接口，用于注册全新的服务

```js
module.exports.start = () => {

}
```

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

把项目压缩，然后 scp 到目标路径，解压并且 npm install，

```shell
# 压缩目录，然后自行 scp 到目标目录，准备好 node 和 pm2 环境
npm run zip

# 在部署服务器上
npm i
npm run deploy
```

-----

## 域名绑定

可以使用 nginx 设置二级域名制定特定的 web server，例如动态路由 dyr.host.com -> host.com/dyr（dyr 为 dynamic-routers 的简称），所有已添加的动态路由都可以通过 dyr.host.com/your-router 访问
