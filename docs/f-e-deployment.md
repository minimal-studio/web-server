# 前端资源版本管理机制

建议权限逻辑

1. 项目与资源分开存储，使用 ID 关联
2. 创建人可以完全控制 project 和 asset 的增删改
3. 其他登入的角色也可以查看，但是需要像 founder 申请权限，加入 collaborator
4. founder 可以添加删除 collaborator
5. 除了查询以外的操作都会做审计记录

资源管理的基本流程

1. 对于登入对应的后台管理系统的账号，默认都有权限创建资源管理
2. 填入对应的信息，创建一个项目
3. 把前端打包好的压缩包上传到对应项目中
4. 可以查看该项目的所有资源的版本
5. 有权限的人可以进行发布，回滚等操作
6. 发送通知，可以是 telegram 的机器人通知，可以是邮件通知

TODO

1. 制定数据清理机制，根据以往经验，保留最近30个项目资源，超出的自动清理，包括文件存储的字段
2. 制定审计记录归档机制，默认方式为，把需要归档的 audit-store.json 放到 ./f-e-deployment-store/audit-archive 下，并且新建一个 audit-store.json 替换

存储路径

- 压缩包 /assets/public/uuid(projName)/zips
- 发布板 /assets/public/uuid(projName)/deploy

存储结构

```js
// store.json
{
  version: 1,
  projects: {
    [projId]: {
      id: 123,
      projName: 'Project1',
      projCode: 'projCode',
      projDesc: 'Desc',
      founder: 'alex',
      webhook: 'url',
      releaseRef: '',
      createdDate: datetime,
      motifyDate: datetime,
      assetsCount: 1,
      collaborators: {
        zoe: {
          updatable: true,
          deletable: true,
          releasable: true,
          active: true,
        },
      },
      collaboratorApplies: [username],
      deployedVersion: 1,
    }
  },
  assets: {
    [assetId]: {
      belongto: projId,
      createdDate: datetime,
      desc: 'description',
      version: 1,
      id: 1,
      isRollback: bool,
      rollbackMark: '',
      founder: 'alex'
    }
  }
}
```

```js
// audit.json
{
  [projId]: [{
    operator: 'alex',
    date: '',
    version: '',
    note: '',
    type: 'rollback || release || createProj || createAsset'
  }]
}
```