const vscode = require("vscode");
const {
  showWindow,
  undopaste,
  increamentAnswerIndex,
  decrementAnswerIndex,
} = require("./src/popup");

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

  let next = vscode.commands.registerCommand("stack-search.next", async () => {
    try {
      increamentAnswerIndex();
    } catch (err) {}
  });

  let prev = vscode.commands.registerCommand("stack-search.prev", async () => {
    try {
      decrementAnswerIndex();
    } catch (err) {}
  });

  context.subscriptions.push(disposable, pop, undo, prev);
};
const deactivate = () => {};

module.exports = {
  activate,
  deactivate,
};
