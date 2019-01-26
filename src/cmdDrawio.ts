import * as vscode from "vscode";
import { DrawioChrome } from "./DrawioChrome";
import * as fs from "fs";
import * as path from "path";

const mdChrome = {} as { [k: string]: DrawioChrome };

// 注册文件关闭监听器，当md文档关闭后，关闭关联的chrome窗口
vscode.workspace.onDidCloseTextDocument(async doc => {
  const docPath = doc.uri.fsPath;
  const chrome = mdChrome[docPath];
  if (chrome) {
    // 如果关闭，则关掉关联的chrome窗口
    await chrome.close();
    delete mdChrome[docPath];
  }
});

async function _getCursorDrawioSvgName() {
  if (!vscode.window.activeTextEditor) return;
  const sel = vscode.window.activeTextEditor.selections;
  if (!sel || sel.length <= 0) return;
  const assetsDirName: string = vscode.workspace
    .getConfiguration("drawio")
    .get("assetsDirName");

  const line = vscode.window.activeTextEditor.document.lineAt(
    sel[0].anchor.line
  );
  const m = line.text.match(/\!\[.*\]\((.*)\)$/);
  console.log("line:", line.lineNumber, line.text, m);

  if (!m || m.length !== 2) return;
  const svgPath = m[1].trim();
  // 检测是否再assets目录下
  if (!svgPath.startsWith(assetsDirName)) {
    console.log(`svg file not in ${assetsDirName} dir`);
  }
  const name = path.parse(svgPath).base;
  console.log("using name:", name);
  // filename
  return name;
}

export const cmdDrawio = vscode.commands.registerCommand(
  "extension.drawio",
  async () => {
    if (
      !vscode.window.activeTextEditor ||
      vscode.window.activeTextEditor.document.languageId !== "markdown"
    ) {
      vscode.window.showInformationMessage(`please open markdown file`);
      return;
    }

    // 获取mdfile，为每个目录的markdown打开一个chrome窗口
    const mdfile = vscode.window.activeTextEditor.document.uri.fsPath;
    const mdPath = path.parse(mdfile).dir;
    try {
      if (!mdChrome[mdPath] || mdChrome[mdPath].isClosed()) {
        mdChrome[mdPath] = new DrawioChrome(mdPath);
        // 等待初始化完成
        await mdChrome[mdPath].init();
      }
      const chrome = mdChrome[mdPath];
      // 获取当前行所在的svg文件名
      const svgName = await _getCursorDrawioSvgName();
      // 激活当前关联的chrome窗口
      await chrome.active(svgName);
    } catch (e) {
      console.error("open chrome error:", e);
    }
  }
);
