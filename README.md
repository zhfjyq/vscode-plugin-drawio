# DRAWIO For Markdown 
> [english version](README.en.md)

在 Markdown 中画图不爽了, 尝试一下这个工具吧,可以将最好用的在线绘图工具DrawIO和 Markdown 无缝整合, 文档同步更新和保存,更支持离线模式,断网也能工作. 支持同步预览和文档生成, 享用流畅的图文 Markdown 吧. 有任何问题请到:https://github.com/zhfjyq/vscode-plugin-drawio 反馈.
如果能够给你帮助,别忘了去以上地址给个星.
![](images/屏幕快照&#32;2019-10-15&#32;上午8.59.29.png)

# DEMO 示例
* 简单图形
![](drawio_assets/demo1.png)

* 网络图
![](drawio_assets/demo2.png)

* 软件图
![](drawio_assets/demo3.png)

#  提示
* DrawIO 不是一个通用 svg 编辑器, 它是一个类似 Visio 的在线流程图软件,我所见到的功能最强大,模板最多,操作最流畅的在线软件,唯一的问题就是在国内网络有点慢,这也是为什么默认为"离线模式"的原因.
* DrawIO 默认文件格式为 XXX.drawio, 但这个格式无法直接嵌入到 markdown 中, 因此需要将文件名改为XXX.svg, 强大的 drawio 可以根据文件名类型自动保存为内嵌编辑信息的 svg 文件,在 markdown 中可以直接预览
* 为了实现自动文件修改和保存(每次修改另存文件实在比较烦),本插件通过 chrome debugger interface 和浏览器窗口进行通讯, 因此需要您把文件存储到 browser 中,即选择存储位置是选择本地浏览器(browser).
* 每次点击图标打开浏览器时,会将当前 markdown 文件同级目录下 drawio_assets/ 的所有保存的文件同步到浏览器,你可以在 drawio 中选择从浏览器打开功能找到这些文件,当然更快捷的方法是在markdown 编辑器中把光标移动到你的图片引用链接上,然后点击图标或者 Ctrl+P ,将自动打开光标下引用文件.
* 为了多个项目不互相干扰,本插件创建了浏览器的独立运行环境,目录在 vscode 打开的项目根目录下的.drawio-chrome 文件夹下,如果你使用 git,强烈建议你将它加到 .gitignore 文件里.

# 在线模式和离线模式
drawio 的离线模式提供了基础的功能(已经很强大了),如果你想要使用在线版本(提供了更多的模板,组件以及 !! 中文语言),只需要在打开的浏览器窗口的地址栏里删除 "offline=1" 即可启动在线版本.


# 使用方法

## 新建文件
1. 安装插件
2. 打开 markdown 文件
3. 点击工具栏小图标
4. 稍等打开浏览器,进入 drawio
5. 选 browser,新建
![](images/op01.png)
![](images/op02.png)
6. 修改文件名,扩展名从.drawio 改为 .png
![](images/op03.png)
![](images/op04.png)
7. 你会在当前markdown文件夹下 的 drawio_assets 中看到这个文件,vscode 中也会有更新保存提示.
8. 插入 svg 到 markdown [标准方法]
```
![](images/test.png)
```
## 打开已有文件
1. 打开 markdown 文件
2. 选择保存位置: browser 浏览器
![](images/op01.png)
3. 选择打开已有流程图,你会看到你 drawio_assets 中所有文件
![](images/op05.png)

## 快速打开流程图
先在 markdown 编辑器中将光标定位到你想要的打开的文件行,再点击图标,然后再点击图标,将直接打开你选择的文件.


# 祝您使用愉快!
