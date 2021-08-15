// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "zhishimd" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('zhishimd.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from !');
	});



	const PROCESS_TEMPLATE_REGEXP = /{set:(.*?)}((.|[\r\n])*?){\/set}/g

	context.subscriptions.push(disposable);

	context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
		'markdown',
		{
			provideCompletionItems(document, position, token, context) {
				const text = stripNonParents(document.getText(), document.lineAt(position).lineNumber);
				const textSplit = text.split('{set:');
				const items: Array<vscode.CompletionItem> = [];
				for (let textSplitIdx = 1; textSplitIdx < textSplit.length; textSplitIdx ++) {
					let item = new vscode.CompletionItem(textSplit[textSplitIdx].split('}')[0], vscode.CompletionItemKind.Text);
					item.range = new vscode.Range(position, position);
					items.push(item);
				}
				return items;
			}
		},
		'{'
	))

	disposable = vscode.commands.registerCommand('zhishimd.toc', () => {
		const panel = vscode.window.createWebviewPanel(
			'zhiShiAiTableOfContents', // Identifies the type of the webview. Used internally
			'zhi-shi.ai Table of Contents', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{
				// Enable scripts in the webview
				enableScripts: true
			  } // Webview options. More on these later.
		  );
		panel.webview.html = getWebviewContent(panel.webview, context);
		vscode.workspace.onDidChangeTextDocument(e => {
			panel.webview.postMessage({ 
				file: vscode.window.activeTextEditor!.document.fileName, 
				content:  vscode.window.activeTextEditor!.document.getText(),
			 });
		});

		let lastLine = -1;

		setInterval(() => {
			if (!vscode.window.activeTextEditor) {
				return;
			}
			const editor = vscode.window.activeTextEditor!;

			const content = editor.document.getText().split("\n");
			let line = editor.selection.start.line;
			let selectedText = "";

			while (line <= editor.selection.end.line && line - editor.selection.start.line < 10) {
				const startFrom = line == editor.selection.start.line ? editor.selection.start.character : 0;
				const endAt = line == editor.selection.end.line ? editor.selection.end.character : content[line].length;

				selectedText += content[line].substr(startFrom, endAt - startFrom);
				selectedText += "\n";
				line ++;
			}

			panel.webview.postMessage({ 
				selectedText: selectedText.trim()
			 });
			
		}, 100);

		vscode.window.onDidChangeTextEditorSelection(e => {
			const editor = vscode.window.activeTextEditor!;
			const content = editor.document.getText().split("\n");
			let lineNo = editor.selection.anchor.line
			if (lastLine == lineNo) {
				return;
			}
			lastLine = lineNo;
			while (lineNo > 0 && !content[lineNo].trim().startsWith('#')) {
				lineNo --;
			}

			panel.webview.postMessage({ 
				title: content[lineNo].split('#').join('').trim(),
				line: lastLine
			 });
		});

		// TODO: validation of uniqueness of nodes
		// TODO: validation of links
		// TODO: external anchors

		panel.webview.onDidReceiveMessage(
			message => {
				const content = vscode.window.visibleTextEditors[0].document.getText().split("\n");
				for (let lineNo = 0; lineNo < content.length; lineNo ++) {
					if (content[lineNo].split('#').join('').trim() === message.gotoTitle) {
						vscode.window.visibleTextEditors[0].revealRange(
							new vscode.Range(
								new vscode.Position(lineNo, 0), 
								new vscode.Position(lineNo, 0)
							),
							vscode.TextEditorRevealType.AtTop
						);

						break;
					}
				}
			},
			undefined,
			context.subscriptions
		  );
		
	});
	context.subscriptions.push(disposable);


}

// this method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext) {
	// cd ~/dev/zhi-shi.ai/browser
	// INLINE_RUNTIME_CHUNK=false yarn build
	// rm -rf ../vscode-ext/zhishimd/media/*
	// cp -r build/* ../vscode-ext/zhishimd/media/
	// geany build/asset-manifest.json
	// update the manufest
	// bump version in package.json
	// cd ~/dev/zhi-shi.ai/vscode-ext/zhishimd
	// yarn vsce package
	const manifest = {
		"files": {
		  "main.css": "/static/css/main.4f480753.chunk.css",
		  "main.js": "/static/js/main.82eced3e.chunk.js",
		  "main.js.map": "/static/js/main.82eced3e.chunk.js.map",
		  "runtime-main.js": "/static/js/runtime-main.4a94e718.js",
		  "runtime-main.js.map": "/static/js/runtime-main.4a94e718.js.map",
		  "static/js/2.167c21eb.chunk.js": "/static/js/2.167c21eb.chunk.js",
		  "static/js/2.167c21eb.chunk.js.map": "/static/js/2.167c21eb.chunk.js.map",
		  "static/js/3.2d767a97.chunk.js": "/static/js/3.2d767a97.chunk.js",
		  "static/js/3.2d767a97.chunk.js.map": "/static/js/3.2d767a97.chunk.js.map",
		  "index.html": "/index.html",
		  "static/css/main.4f480753.chunk.css.map": "/static/css/main.4f480753.chunk.css.map",
		  "static/js/2.167c21eb.chunk.js.LICENSE.txt": "/static/js/2.167c21eb.chunk.js.LICENSE.txt"
		},
		"entrypoints": [
		  "static/js/runtime-main.4a94e718.js",
		  "static/js/2.167c21eb.chunk.js",
		  "static/css/main.4f480753.chunk.css",
		  "static/js/main.82eced3e.chunk.js"
		]
	  };

	return `
	<!doctype html>
	<html lang="en">
	   <head>
		  <meta charset="utf-8"/>
		  <link rel="icon" href="/favicon.ico"/>
		  <meta name="viewport" content="width=device-width,initial-scale=1"/>
		  <meta name="theme-color" content="#000000"/>
		  <meta name="description" content="Web site created using create-react-app"/>
		  <link rel="apple-touch-icon" href="/logo192.png"/>
		  <link rel="manifest" href="/manifest.json"/>
		  <title>React App</title>
		  <link href="${webview.asWebviewUri(vscode.Uri.file(context.extensionPath + '/media/' + manifest.entrypoints[2]))}" rel="stylesheet">
	   </head>
	   <body style='background: white; color: black'>
		  <noscript>You need to enable JavaScript to run this app.</noscript>
		  <div id="root"></div>
		  <script src="${webview.asWebviewUri(vscode.Uri.file(context.extensionPath + '/media/' + manifest.entrypoints[0]))}"></script>
		  <script src="${webview.asWebviewUri(vscode.Uri.file(context.extensionPath + '/media/' + manifest.entrypoints[1]))}"></script>
		  <script src="${webview.asWebviewUri(vscode.Uri.file(context.extensionPath + '/media/' + manifest.entrypoints[3]))}"></script>

			<script>

			const vscode = acquireVsCodeApi();

			window.externalGotoEditor = (title) => {
				vscode.postMessage({
					gotoTitle: title
				});
			};

			window.addEventListener('message', event => {
					if (event.data.content) {
						window.externalText = event.data.content;
					}
					if (event.data.title) {
						window.externalNodeTitle = event.data.title;
					}
					if (event.data.line) {
						window.externalNodeLine = event.data.line;
					}
					if (event.data.selectedText !== undefined) {
						window.externalSelectedText = event.data.selectedText;
					}
			});

			</script>


	   </body>
	</html>	`;
  }


function stripNonParents(text: string, startLine: number): string {
	let strippedText = '';
	const lines = text.split("\n");
	let currentDelimiter = '#######################################################################';
	let nodeText = '';
	for (let lineNo = startLine; lineNo >= 0; lineNo -- ) {
		const line = lines[lineNo];
		if (line.startsWith('#')) {
			const lineDelim = line.split(' ')[0];
			if (lineDelim.length < currentDelimiter.length) {
				currentDelimiter = lineDelim;
				strippedText = nodeText + strippedText;
			}
			nodeText = '';
		} else {
			nodeText = line + nodeText;
		}
	}
	return strippedText;
}

