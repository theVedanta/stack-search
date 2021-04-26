const vsc = require("vscode");
const fetch = require("node-fetch");
const { htmlToText } = require("html-to-text");
var prev = undefined;
let answerIndex = 0;
let answers = [];
let noAnswers = [];
const editor = vsc.window.activeTextEditor;

// API - https://api.stackexchange.com/search/advanced?site=stackoverflow.com&q=${something}

// 9810736503 - sunil dubey - medanta (sandeep) ayushmann

function decodeHTMLEntities(text) {
  var entities = [
    ["amp", "&"],
    ["apos", "'"],
    ["#x27", "'"],
    ["#x2F", "/"],
    ["#39", "'"],
    ["#47", "/"],
    ["lt", "<"],
    ["gt", ">"],
    ["nbsp", " "],
    ["quot", '"'],
  ];

  for (var i = 0, max = entities.length; i < max; ++i)
    text = text.replace(
      new RegExp("&" + entities[i][0] + ";", "g"),
      entities[i][1]
    );

  return text;
}

const showWindow = async () => {
  noAnswers = [];
  answers = [];
  answerIndex = 0;

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

  const quickPick = vsc.window.createQuickPick();
  const query = x.trim();

  const res = await fetch(
    `https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=relevance&q=${query}&site=stackoverflow`
  );
  const data = await res.json();

  quickPick.items = data.items
    .filter((item) => item.is_answered)
    .map((item) => ({
      label: decodeHTMLEntities(item.title),
      id: item.question_id,
    }));

  if (quickPick.items.length == 0) {
    quickPick.items = [{ label: "No Items" }];
  } else {
    quickPick.onDidChangeActive(async (item) => {
      quickPick.placeholder = query;
      if (answers.length !== 0 || noAnswers.length !== 0) {
        try {
          undopaste();
        } catch (err) {}
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

          if (ansBody.length <= 20) {
            ansBody = answr.body
              .slice(
                answr.body.indexOf("<code>", answr.body.indexOf("<code>") + 1) +
                  6,
                answr.body.indexOf("</code>", answr.body.indexOf("</code>") + 1)
              )
              .trim();
          }
          answers.push(decodeHTMLEntities(ansBody));
        } else {
          noAnswers.push(htmlToText(answr.body));
        }
      }

      if (answers.length === 0) {
        vsc.window.showWarningMessage(
          "No code found in answer, showing info instead"
        );
        vsc.window.showInformationMessage(noAnswers[answerIndex]);
        return;
      }

      while (answers[answerIndex].split(/\r\n|\r|\n/).length == 1) {
        answerIndex += 1;
      }

      editor.edit((edit) => {
        edit.insert(editor.selection.active, answers[answerIndex]);
      });
      const lines = answers[answerIndex].split(/\r\n|\r|\n/).length;

      prev = { line: editor.selection.active._line, lines: lines };
    });
  }

  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();
};

function undopaste() {
  editor.edit((edit) => {
    const area = editor.selection;
    area._start._line = prev.line;
    area._start._character = 0;
    area._end._line = prev.line + prev.lines - 1;
    area._end._character = 100;
    edit.delete(area, "");
  });
}

function increamentAnswerIndex() {
  undopaste();
  answerIndex++;
  if (answers[answerIndex] !== undefined) {
    if (answers.length === 0) {
      vsc.window.showWarningMessage(
        "No code found in answer, showing info instead"
      );
      vsc.window.showInformationMessage(noAnswers[answerIndex]);
    } else {
      editor.edit((edit) => {
        edit.insert(editor.selection.active, `${answers[answerIndex]}`);
      });
    }
  } else {
    answerIndex--;
    vsc.window.showErrorMessage("No more answers!");
  }
}

function decrementAnswerIndex() {
  undopaste();
  answerIndex--;
  if (answers[answerIndex] !== undefined) {
    if (answers.length === 0) {
      vsc.window.showWarningMessage(
        "No code found in answer, showing info instead"
      );
      vsc.window.showInformationMessage(noAnswers[answerIndex]);
    } else {
      editor.edit((edit) => {
        edit.insert(editor.selection.active, `${answers[answerIndex]}`);
      });
    }
  } else {
    answerIndex++;
    vsc.window.showErrorMessage("No more answers!");
  }
}

module.exports = {
  showWindow,
  undopaste,
  increamentAnswerIndex,
  decrementAnswerIndex,
};
