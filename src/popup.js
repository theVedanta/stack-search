const vsc = require("vscode");
const fetch = require("node-fetch");
const { htmlToText } = require("html-to-text");
const autocorrect = require("autocorrect")();
var prev = undefined;

/**
 * @param {vscode.ExtensionContext} context
 */

// API - https://api.stackexchange.com/search/advanced?site=stackoverflow.com&q=${something}

const showWindow = async () => {
  let noAnswers = [];
  let answers = [];
  let answerIndex = 0;

  const editor = vsc.window.activeTextEditor;

  if (!editor) {
    vsc.window.showErrorMessage("No editor open!");
    return;
  }

  async function getUserInfo() {
    let userInputWindow = await vsc.window.showInputBox({
      prompt: "Search for Answers",
    });
    return userInputWindow;
  }

  var x = await getUserInfo();

  x = x.split(" ");
  let finalString = "";
  let correctWords = [];

  for (let y of x) {
    let correct = autocorrect(y);
    correctWords.push(correct);
  }

  for (let word of correctWords) {
    finalString += `${word} `;
  }

  const quickPick = vsc.window.createQuickPick();
  const query = finalString.trim();

  const res = await fetch(
    `https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=relevance&q=${query}&site=stackoverflow`
  );
  const data = await res.json();

  quickPick.items = data.items
    .filter((item) => item.is_answered)
    .map((item) => ({
      label: item.title,
      id: item.question_id,
    }));

  if (quickPick.items.length == 0) {
    quickPick.items = [{ label: "No Items" }];
  } else {
    quickPick.onDidChangeActive(async (item) => {
      quickPick.placeholder = query;
      if (answers.length !== 0 || noAnswers.length !== 0) {
        undopaste();
      }

      answers = [];
      noAnswers = [];
      answerIndex = 0;

      const anss = await fetch(
        `https://api.stackexchange.com/2.2/questions/${item[0].id}?&site=stackoverflow&filter=!-MBrU_IzpJ5H-AG6Bbzy.X-BYQe(2v-.J`
      );
      const ans = await anss.json();

      for (let answr of ans.items[0].answers) {
        if (answr.body.includes("<code>")) {
          let ansBody = answr.body
            .slice(
              answr.body.indexOf("<code>") + 6,
              answr.body.indexOf("</code>")
            )
            .trim();

          if (ansBody.length <= 25) {
            ansBody = answr.body
              .slice(
                answr.body.indexOf("<code>", answr.body.indexOf("<code>") + 1) +
                  6,
                answr.body.indexOf("</code>", answr.body.indexOf("</code>") + 1)
              )
              .trim();
          }
          answers.push(ansBody);
        } else {
          noAnswers.push(htmlToText(answr.body));
        }
      }

      if (answers.length === 0) {
        vsc.window.showWarningMessage(
          "No code found in answer, showing info instead"
        );
        vsc.window.showInformationMessage(noAnswers[0]);
        return;
      }

      editor.edit((edit) => {
        edit.insert(editor.selection.active, answers[answerIndex]);
      });
      const lines = answers[0].split(/\r\n|\r|\n/).length;

      prev = { line: editor.selection.active._line, lines: lines };
    });
  }

  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();
};

function undopaste() {
  const editor = vsc.window.activeTextEditor;
  editor.edit((edit) => {
    const area = editor.selection;
    area._start._line = prev.line;
    area._start._character = 0;
    area._end._line = prev.line + prev.lines - 1;
    area._end._character = 100;
    edit.delete(area, "");
  });
}

module.exports = { showWindow, undopaste };
