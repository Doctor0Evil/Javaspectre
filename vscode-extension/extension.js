// Path: vscode-extension/extension.js

const vscode = require('vscode');

function activate(context) {
  const validateCommand = vscode.commands.registerCommand(
    'javaspectre.aln.validateCurrent',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor for ALN validation.');
        return;
      }

      const doc = editor.document;
      const text = doc.getText();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        vscode.window.showErrorMessage('ALN validation: document is not valid JSON.');
        return;
      }

      const missing = [];
      if (typeof parsed.intent !== 'object') missing.push('intent');
      if (typeof parsed.domain !== 'string') missing.push('domain');
      if (typeof parsed.constraints !== 'object') missing.push('constraints');
      if (typeof parsed.environment !== 'object') missing.push('environment');
      if (typeof parsed.artifacts !== 'object') missing.push('artifacts');

      if (missing.length > 0) {
        vscode.window.showErrorMessage(
          `ALN validation failed: missing or malformed keys: ${missing.join(', ')}`
        );
      } else {
        vscode.window.showInformationMessage('ALN document appears structurally valid.');
      }
    }
  );

  context.subscriptions.push(validateCommand);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
