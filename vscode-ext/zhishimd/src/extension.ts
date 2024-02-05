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
				const directParentsText = stripNonParents(document.getText(), document.lineAt(position).lineNumber);
				const textSplit = directParentsText.map(line => line.lineText).join("\n").split('{set:');
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
	));

	context.subscriptions.push(vscode.languages.registerDefinitionProvider(
		'markdown',
		{
			provideDefinition(document, position, token) {
				const line = document.lineAt(position).text;
				const template = extractTemplateText(line, position);
				if (template) {
					const directParentsText = stripNonParents(document.getText(), document.lineAt(position).lineNumber);
					const templateDefinitionLine =directParentsText.find(line => line.lineText.indexOf("{set:" + template + "}") >= 0);
					if (templateDefinitionLine) {
						return {
							uri: document.uri,
							range: new vscode.Range(
								new vscode.Position(templateDefinitionLine.lineNo+1, 0), 
								new vscode.Position(templateDefinitionLine.lineNo+2, 0)
							)
						}
					}
				}
				return [];
			}
		}
	));

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

		let lastTextSent = '';
		function updateEditorText() {
			if (vscode.window.activeTextEditor) {
				if (vscode.window.activeTextEditor!.document.getText() != lastTextSent) {
					lastTextSent = vscode.window.activeTextEditor!.document.getText();
						panel.webview.postMessage({ 
							file: vscode.window.activeTextEditor!.document.fileName, 
							content:  lastTextSent,
						});
				}
			}
		}

		vscode.workspace.onDidChangeTextDocument(updateEditorText);
		setInterval(updateEditorText, 100);

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
	// cd ~/dev/zhi-shi.ai/app
	// INLINE_RUNTIME_CHUNK=false yarn build
	// rm -rf ../vscode-ext/zhishimd/media/*
	// cp -r build/* ../vscode-ext/zhishimd/media/
	// geany build/asset-manifest.json
	// update the manufest below from the content of opened file
	// bump version in package.json
	// cd ~/dev/zhi-shi.ai/vscode-ext/zhishimd
	// yarn vsce package
	const manifest = {
		"files": {
			"main.css": "/static/css/main.0d2aadaa.chunk.css",
			"main.js": "/static/js/main.5d973ccc.chunk.js",
			"main.js.map": "/static/js/main.5d973ccc.chunk.js.map",
			"runtime-main.js": "/static/js/runtime-main.a7fcf716.js",
			"runtime-main.js.map": "/static/js/runtime-main.a7fcf716.js.map",
			"static/js/2.a8cb5904.chunk.js": "/static/js/2.a8cb5904.chunk.js",
			"static/js/2.a8cb5904.chunk.js.map": "/static/js/2.a8cb5904.chunk.js.map",
			"static/js/3.bcae73e3.chunk.js": "/static/js/3.bcae73e3.chunk.js",
			"static/js/3.bcae73e3.chunk.js.map": "/static/js/3.bcae73e3.chunk.js.map",
			"index.html": "/index.html",
			"static/css/main.0d2aadaa.chunk.css.map": "/static/css/main.0d2aadaa.chunk.css.map",
			"static/js/2.a8cb5904.chunk.js.LICENSE.txt": "/static/js/2.a8cb5904.chunk.js.LICENSE.txt"
		  },
		  "entrypoints": [
			"static/js/runtime-main.a7fcf716.js",
			"static/js/2.a8cb5904.chunk.js",
			"static/css/main.0d2aadaa.chunk.css",
			"static/js/main.5d973ccc.chunk.js"
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

		  <script>

		  window.vscode = acquireVsCodeApi();

		  window.externalGotoEditor = (title) => {
			window.vscode.postMessage({
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


		  <div id="root"></div>
		  <script src="${webview.asWebviewUri(vscode.Uri.file(context.extensionPath + '/media/' + manifest.entrypoints[0]))}"></script>
		  <script src="${webview.asWebviewUri(vscode.Uri.file(context.extensionPath + '/media/' + manifest.entrypoints[1]))}"></script>
		  <script src="${webview.asWebviewUri(vscode.Uri.file(context.extensionPath + '/media/' + manifest.entrypoints[3]))}"></script>

		


	   </body>
	</html>	`;
  }


function stripNonParents(text: string, startLine: number): Array<{lineNo: number, lineText: string}> {
	let strippedText: Array<{lineNo: number, lineText: string}> = [];
	const lines = text.split("\n");
	let currentDelimiter = '#######################################################################';
	let nodeText: Array<{lineNo: number, lineText: string}> = [];
	for (let lineNo = startLine; lineNo >= 0; lineNo -- ) {
		const line = lines[lineNo];
		if (line.startsWith('#')) {
			const lineDelim = line.split(' ')[0];
			if (lineDelim.length < currentDelimiter.length) {
				currentDelimiter = lineDelim;
				strippedText = nodeText.concat(strippedText);
			}
			nodeText = [];
		} else {
			nodeText.unshift({lineNo: lineNo, lineText: line});
		}
	}
	return strippedText;
}

function extractTemplateText(line: string, position: vscode.Position) {
	let left = '';
	for (let pos = position.character; pos >= 0; pos --) {
		if (line[pos] == '{') {
			left = '{' + left;
			break;
		}
		left = line[pos] + left;
	}
	if (!left.startsWith('{')) {
		return undefined;
	}
	let right = '';
	for (let pos = position.character + 1; pos < line.length; pos ++) {
		if (line[pos] == '}') {
			right = right + '}';
			break;
		}
		right = right + line[pos];
	}
	if (!right.endsWith('}')) {
		return undefined;
	}
	return (left + right).substr(1, (left + right).length - 2);
}

