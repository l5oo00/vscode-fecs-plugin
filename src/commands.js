/**
 * @file: commands.js
 * @description ..
 */
const {window, commands, Uri} = require('vscode');
const {isSupportEditor} = require('./util.js');
const config = require('./config.js');
const editorLib = require('./editor.js');
const {
    addDisableCommentForSelectedBlock,
    addDisableCommentForSelectedBlocks,
    addDisableCommentForLine
} = require('./comment.js');

function registerFormatCommand() {
    return commands.registerCommand('vscode-fecs-plugin.format', () => {
        const editor = window.activeTextEditor;
        if (!editor || !isSupportEditor(editor)) {
            return;
        }

        editorLib.wrap(editor).format();
    });
}

function registerDisableCheckCommand() {
    return commands.registerCommand('vscode-fecs-plugin.disable-check', () => {
        config.disableCheck = true;
        editorLib.dispose();
        window.showInformationMessage('Fecs Check: OFF');
    });
}
function registerEnableCheckCommand() {
    return commands.registerCommand('vscode-fecs-plugin.enable-check', () => {
        config.disableCheck = false;
        editorLib.checkAllVisibleTextEditor();
        window.showInformationMessage('Fecs Check: ON');
    });
}

function registerAddDisableCommentCommand() {
    return commands.registerCommand('vscode-fecs-plugin.add-disable-rule-comment', () => {
        const editor = window.activeTextEditor;
        if (!editor || !isSupportEditor(editor)) {
            return;
        }

        addDisableCommentForSelectedBlocks(editorLib.wrap(editor));
    });
}

function registerAddDisableCommentForLineCommand() {
    return commands.registerCommand('vscode-fecs-plugin.add-disable-rule-comment-for-line', lineNumber => {
        const editor = window.activeTextEditor;
        if (!editor || !isSupportEditor(editor)) {
            return;
        }

        addDisableCommentForLine(editorLib.wrap(editor), lineNumber);
    });
}

function registerAddDisableCommentForEntireSelectionBlockCommand() {
    return commands.registerCommand(
        'vscode-fecs-plugin.add-disable-rule-comment-for-entire-selection-block',
        () => {
            const editor = window.activeTextEditor;
            if (!editor || !isSupportEditor(editor)) {
                return;
            }

            addDisableCommentForSelectedBlock(editorLib.wrap(editor), true);
        }
    );
}

function registerSearchRuleInBrowserCommand() {
    return commands.registerCommand('vscode-fecs-plugin.search-rule-in-browser', () => {
        const editor = window.activeTextEditor;
        if (!editor || !isSupportEditor(editor)) {
            return;
        }

        const url = editorLib.wrap(editor).getViewRuleUrl();
        if (url) {
            commands.executeCommand('vscode.open', Uri.parse(url));
        }
    });

}

/**
 * 注册插件 command
 *
 * @param {ExtensionContext} context 扩展上下文
 */
function registerNewCommand(context) {
    context.subscriptions.push(registerFormatCommand());
    context.subscriptions.push(registerDisableCheckCommand());
    context.subscriptions.push(registerEnableCheckCommand());
    context.subscriptions.push(registerAddDisableCommentCommand());
    context.subscriptions.push(registerAddDisableCommentForLineCommand());
    context.subscriptions.push(registerAddDisableCommentForEntireSelectionBlockCommand());
    context.subscriptions.push(registerSearchRuleInBrowserCommand());
}
exports.registerNewCommand = registerNewCommand;
