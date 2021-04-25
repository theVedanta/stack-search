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
    vscode.window.showInformationMessage(`Hello from Stack Search!
Press: shift & \` for bringing up the search
Press: escape to exit search once satisfied
Press: shift & u for undoing the last code block pasted from stack-search
Press: shift & + to see the next answer
Press: shift & - to see the previous answer`);
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
