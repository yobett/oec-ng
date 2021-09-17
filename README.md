OEC 现货交易助手（前端）

## 简介
这里是OEC现货交易助手的前端部分，采用Angular开发。后端部分见 https://github.com/yobett/oec-nest 。

更多介绍见后端项目。

界面截图见Wiki。



## Build

进入项目目录，安装依赖：

```shell
npm install
```

### 开发环境

部署、运行后端。

打开`src/environments/environment.ts`，确认后端地址（默认不用修改）。

启动前端：

```shell
npm run start
```

访问：http://localhost:4200/ 。



### 生产环境

打开`src/environments/environment.prod.ts`，配置生产环境的后端地址。

构建：

```shell
npm run build
```

把生成的`dist/oec`文件夹拷到生产服务器上。



## License

MIT

