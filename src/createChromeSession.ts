/**
 * copy and modify from lib: chrome-debugging-client
 * add options: clearUserData to control
 */

import createAPIClient from "chrome-debugging-client/dist/lib/create-api-client";
import createDebuggingProtocolClient from "chrome-debugging-client/dist/lib//create-debugging-protocol-client";
import createHTTPClient from "chrome-debugging-client/dist/lib//create-http-client";
import createTargetConnection from "chrome-debugging-client/dist/lib//create-target-connection";
import createTmpDir from "chrome-debugging-client/dist/lib//create-tmpdir";
import Disposables from "chrome-debugging-client/dist/lib//disposables";
import openWebSocket from "chrome-debugging-client/dist/lib//open-web-socket";
import resolveBrowser from "chrome-debugging-client/dist/lib//resolve-browser";
import spawnBrowser from "chrome-debugging-client/dist/lib//spawn-browser";
import {
  IAPIClient,
  IBrowserProcess,
  IConnection,
  IDebuggingProtocolClient,
  IDisposable,
  IResolveOptions,
  ISession,
  ISpawnOptions
} from "chrome-debugging-client/dist/lib/types";

import * as path from "path";

export interface ISpawnOptionsExt extends ISpawnOptions {
  autoDeleteUseDataDir?: boolean; //是否自动删除用户目录
}
export interface ISessionExt extends ISession {
  spawnBrowser(
    options?: IResolveOptions & ISpawnOptionsExt
  ): Promise<IBrowserProcess>;
}

export type SessionCallback<T> = (session: ISessionExt) => PromiseLike<T> | T;

export function createSession<T>(cb: SessionCallback<T>): Promise<T>;
export function createSession(): ISessionExt;
export function createSession(
  cb?: SessionCallback<any>
): Promise<any> | ISessionExt {
  if (cb === undefined) {
    return new Session();
  }
  return usingSession(cb);
}

async function usingSession(cb: SessionCallback<any>) {
  const session = new Session();
  try {
    return await cb(session);
  } finally {
    await session.dispose();
  }
}

class Session implements ISessionExt {
  private disposables = new Disposables();

  public async spawnBrowser(
    options?: IResolveOptions & ISpawnOptionsExt
  ): Promise<IBrowserProcess> {
    const executablePath = resolveBrowser(options);
    let userDataDir = "";
    if (options.userDataRoot && !options.autoDeleteUseDataDir) {
      userDataDir = path.resolve(options.userDataRoot, "chrome-data");
    } else {
      const tmpDir = await createTmpDir(options && options.userDataRoot);
      this.disposables.add(tmpDir);
      userDataDir = tmpDir.path;
    }

    const browserProcess = await spawnBrowser(
      executablePath,
      userDataDir,
      options
    );
    this.disposables.add(browserProcess);
    return browserProcess;
  }

  public createAPIClient(host: string, port: number): IAPIClient {
    return createAPIClient(createHTTPClient(host, port));
  }

  public async openDebuggingProtocol(
    webSocketDebuggerUrl: string
  ): Promise<IDebuggingProtocolClient> {
    return this.createDebuggingProtocolClient(
      this.addDisposable(await openWebSocket(webSocketDebuggerUrl))
    );
  }

  public async attachToTarget(
    browserClient: IDebuggingProtocolClient,
    targetId: string
  ): Promise<IDebuggingProtocolClient> {
    const { sessionId } = await browserClient.send<{ sessionId: string }>(
      "Target.attachToTarget",
      {
        targetId
      }
    );
    return this.createTargetSessionClient(browserClient, sessionId);
  }

  public createTargetSessionClient(
    browserClient: IDebuggingProtocolClient,
    sessionId: string
  ) {
    const connection = this.addDisposable(
      createTargetConnection(browserClient, sessionId)
    );
    return this.createDebuggingProtocolClient(connection);
  }

  public createSession(): ISession {
    return this.addDisposable(new Session());
  }

  public dispose() {
    return this.disposables.dispose();
  }

  private createDebuggingProtocolClient(connection: IConnection) {
    return this.addDisposable(createDebuggingProtocolClient(connection));
  }

  private addDisposable<T extends IDisposable>(disposable: T): T {
    return this.disposables.add(disposable);
  }
}
