const vscode = require("vscode");
const { showWindow, undopaste } = require("./src/popup");

/**
 * @param {vscode.ExtensionContext} context
 */
const activate = async (context) => {
  let disposable = vscode.commands.registerCommand("stack-search.start", () => {
    vscode.window.showInformationMessage("Stack search is now active");
  });

  let pop = vscode.commands.registerCommand("stack-search.pop", () => {
    showWindow();
  });

  let undo = vscode.commands.registerCommand("stack-search.undo", () => {
    undopaste();
  });

  context.subscriptions.push(disposable, pop, undo);
};
const deactivate = () => {};

module.exports = {
  activate,
  deactivate,
};
