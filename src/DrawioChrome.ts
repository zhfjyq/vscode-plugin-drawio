import {
  ISession,
  IBrowserProcess,
  IAPIClient,
  IDebuggingProtocolClient,
  ITabResponse,
} from "chrome-debugging-client";

import { createSession, ISessionExt } from "./createChromeSession";

import {
  HeapProfiler,
  Page,
  DOMStorage,
} from "chrome-debugging-client/dist/protocol/tot";

import * as vscode from "vscode";

import * as url from "url";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { close } from "inspector";
import { format } from "url";

class DrawioTab {
  private _page: undefined | Page;
  private _domstorage: undefined | DOMStorage;
  constructor(debugClient: IDebuggingProtocolClient) {}
}

/**
 * 管理draw.io的chrome实例
 */

export class DrawioChrome {
  private _mdFilePath: string;
  private _assetsPath: string;
  private _session: undefined | ISessionExt;
  private _process: undefined | IBrowserProcess;
  private _apiClient: undefined | IAPIClient;
  private _debugClient: undefined | IDebuggingProtocolClient;
  private _page: undefined | Page;
  private _domstorage: undefined | DOMStorage;
  private _chromeWorkDir: undefined | string;
  private _tab: undefined | ITabResponse;
  constructor(mdFilePath: string) {
    console.log("open drawio chrome for", this._mdFilePath);

    // 加载assets目录的所有文件到localstorage
    this._initChromeWorkDir();
    this._initAssetsDir(mdFilePath);
  }

  _initChromeWorkDir() {
    console.log("-----!", vscode.workspace.workspaceFolders);
    if (
      vscode.workspace.workspaceFolders &&
      vscode.workspace.workspaceFolders.length > 0
    ) {
      this._chromeWorkDir = path.resolve(
        vscode.workspace.workspaceFolders[0].uri.fsPath,
        ".drawio-chrome",
      );
    } else {
      this._chromeWorkDir = path.resolve(os.tmpdir(), "drawio-chrome");
    }

    if (!fs.existsSync(this._chromeWorkDir)) {
      console.log("make assets dir:", this._chromeWorkDir);
      fs.mkdirSync(this._chromeWorkDir);
    }
  }
  _initAssetsDir(mdFile: string) {
    this._mdFilePath = mdFile;

    const assetsDirName: string = vscode.workspace
      .getConfiguration("drawio")
      .get("assetsDirName");
    this._assetsPath = path.resolve(mdFile, assetsDirName);
    if (!fs.existsSync(this._assetsPath)) {
      console.log("make assets dir:", this._assetsPath);
      fs.mkdirSync(this._assetsPath);
    }
  }

  /**
   * 初始化并加载assets
   */
  async init() {
    // 创建新的chrome session
    this._session = await createSession();
    this._process = await this._session.spawnBrowser({
      additionalArguments: [
        "--mute-audio",
        "--disable-infobars",
        "--enable-automation",
        // `--app=${this._drawioUrl()}`,
      ],
      windowSize: { width: 1024, height: 720 },
      userDataRoot: this._chromeWorkDir,
      autoDeleteUseDataDir: false,
      stdio: "inherit",
    });
    // 连接apiclient
    console.log("spawnBrowser:port=", this._process.remoteDebuggingPort);
    this._apiClient = await this._session.createAPIClient(
      "localhost",
      this._process.remoteDebuggingPort,
    );
    console.log("apiClient connected");
    // 连接到新打开的tab
    this._tab = (await this._apiClient.listTabs())[0];

    // 创建debugclient
    this._debugClient = await this._session.openDebuggingProtocol(
      this._tab.webSocketDebuggerUrl,
    );
    // 当用户关闭当前debug连接的tab时，关掉整个浏览器
    this._debugClient.on("close", async ev => {
      await this.close();
    });
    console.log("debugClient connected:", this._tab.webSocketDebuggerUrl);

    // 打开page
    this._page = new Page(this._debugClient);
    await this._page.enable();

    // 打开drawio
    await this._page.navigate({ url: this._drawioUrl() });

    // 打开storage
    this._domstorage = new DOMStorage(this._debugClient);
    await this._domstorage.enable();

    // dom保存事件
    this._domstorage.domStorageItemUpdated = async params => {
      if (params.key.match(".+.svg")) {
        fs.writeFileSync(
          path.join(this._assetsPath, params.key),
          params.newValue,
        );
        vscode.window.showInformationMessage(`save drawio svg:${params.key}`);
      }
    };

    // 加载所有的assets到浏览器
    await this._loadAllAssetsToChrome();
  }
  isClosed() {
    return !this._session;
  }

  private _drawioUrl(fileName?: string) {
    const offline: boolean = vscode.workspace
      .getConfiguration("drawio")
      .get("offline");
    const f = fileName ? `L${fileName}` : "";
    return offline
      ? `https://www.draw.io?offline=1#${f}`
      : `https://www.draw.io#${f}`;
  }

  async _loadAllAssetsToChrome() {
    if (!this._domstorage) {
      console.log("domstorage not opened!");
      return;
    }

    const files = fs.readdirSync(this._assetsPath);
    console.log("----readdirSync:", files, this._assetsPath);
    let count = 0;
    for (const f of files) {
      console.log("----dir:", f);
      if (f.startsWith(".")) continue;
      if (!fs.statSync(path.join(this._assetsPath, f)).isFile()) {
        continue;
      }
      if (path.parse(f).ext !== ".svg") {
        continue;
      }
      await this._domstorage.setDOMStorageItem({
        storageId: {
          isLocalStorage: true,
          securityOrigin: "https://www.draw.io",
        },
        key: f,
        value: fs.readFileSync(path.join(this._assetsPath, f), {
          encoding: "utf8",
        }),
      });
      count++;
      console.log(`${count} load asset to chrome: ${f}`);
    }
    console.log(`${count} file loaded`);
  }

  /**
   * 在第一个tab页面中打开
   * @param svgFile
   */
  async active(svgFile?: string) {
    console.log("active:", svgFile);
    await this._page.navigate({ url: this._drawioUrl(svgFile) });
    await this._apiClient.activateTab(this._tab.id);

    // await this._page.navigate()
  }

  async close() {
    this._domstorage = null;
    if (this._debugClient) {
      await this._debugClient.dispose();
      this._debugClient = null;
    }

    if (this._page) {
      this._page = null;
    }
    this._apiClient = null;
    if (this._process) {
      await this._process.dispose();
      this._process = null;
    }

    if (this._session) {
      await this._session.dispose();
      this._session = null;
    }
    console.log("close chrome for:", this._mdFilePath);
  }
}
