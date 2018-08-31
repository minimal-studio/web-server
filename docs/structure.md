# Structure

## 基本结构

本 web server 程序运行在一个服务端口，通过不同的二级路由做不同的服务，内置以下通用服务

### 1. 动态路由服务

动态路由服务，用于动态使用 /dynamic-routres 下的文件路由
127.0.0.1:3000/dynamic-router

例如添加一个 test 到 /dynamic-routres 中
/dynamic-routres/test/index.js

当请求访问以下链接时，可以提供对应的动态路由
127.0.0.1:3000/dyr/test

挂载在特定的路由下主要是为了避免二级路由的重名而产生的不可预见的问题

### 动态路由解决的问题

动态路由主要为了解决两种特定业务需求

1. 通过特定的 url 访问应用程序入口
   例如上传的前端资源，有需要先获取远端业务服务器的数据，编译到模版中
   模版存储路径为 /assets/public/admin/html/index.ejs
   但是期望通过 host/dyr/app1 这个路由，完成上述情况的
   可以通过编写对应业务的动态路由，制定模版路径，然后完成以上操作

2. 通过 public 共享资源直接访问入口的
   例如 host/public/admin/index.html
   但是需要获取额外数据的，可以在该 html 中编写请求，来获取特定的数据
   例如 /assets/public/admin/index.html 中，请求 /dyr/get-admin-data 获取特定数据
   可以通过编写动态路由响应

### 2. public 静态资源服务

127.0.0.1:3000/public

### 3. auth 系统验证接口

127.0.0.1:3000/auth

考虑使用 GraphQL 来提供基础权限和验证
