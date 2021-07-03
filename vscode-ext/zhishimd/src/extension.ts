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


	context.subscriptions.push(disposable);

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
				// line: vscode.window.activeTextEditor!.selection.anchor.line,
				// pos: vscode.window.activeTextEditor!.selection.anchor.character,
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
				for (let pos = startFrom; pos < endAt; pos++ ){
					selectedText += content[line][pos];
				}
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
				// file: vscode.window.activeTextEditor!.document.fileName, 
				// content:  vscode.window.activeTextEditor!.document.getText(),
				// line: vscode.window.activeTextEditor!.selection.anchor.line,
				// pos: v8scode.window.activeTextEditor!.selection.anchor.character,
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
							)
						);

						// vscode.window.visibleTextEditors[0].selection = new vscode.Selection(
						// 	new vscode.Position(lineNo, 0),
						// 	new vscode.Position(lineNo, 0)
						// 	);

						// 	vscode.window.visibleTextEditors[0].
						break;
					}
				}

				// vscode.workspace.openTextDocument(message.file).then(doc => {
				// 	vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside).then(textDoc => {
				// 		textDoc.selection = new vscode.Selection(
				// 			new vscode.Position(parseInt(message.line), 0),
				// 			new vscode.Position(parseInt(message.line), 0)
				// 			);
				// 			console.log(message);
				// 	});
				//   });
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
		  <link href="${webview.asWebviewUri(vscode.Uri.file(context.extensionPath + '/media/static/css/main.ebcecd17.chunk.css'))}" rel="stylesheet">
	   </head>
	   <body style='background: white; color: black'>
		  <noscript>You need to enable JavaScript to run this app.</noscript>
		  <div id="root"></div>
		  <script src="${webview.asWebviewUri(vscode.Uri.file(context.extensionPath + '/media/static/js/runtime-main.cbffb267.js'))}"></script>
		  <script src="${webview.asWebviewUri(vscode.Uri.file(context.extensionPath + '/media/static/js/2.724c6693.chunk.js'))}"></script>
		  <script src="${webview.asWebviewUri(vscode.Uri.file(context.extensionPath + '/media/static/js/main.7940ef51.chunk.js'))}"></script>

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
					if (event.data.selectedText) {
						window.externalSelectedText = event.data.selectedText;
					}
			});

			</script>


	   </body>
	</html>	`;



	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cat Coding</title>
  </head>
  <body>
	  <pre id="lines-of-code-counter">01</pre>

	  <script>
	  const vscode = acquireVsCodeApi();
	  	function goTo() {
			  vscode.postMessage({
					file: document.getElementById('fileinput').value,
					line: document.getElementById('filelineno').value
			  });
		  }
		
	  </script>

	  <div>
	  	File: <input id='fileinput' /> <br />

		<div>
	  Line: <input id='filelineno' /> <br />
	  		<button onClick='goTo();'>GO</button>
		</div>
  
	  <script>
		document.getElementById('lines-of-code-counter').innerHTML = '3';
  
		  // Handle the message inside the webview
		  window.addEventListener('message', event => {
  
			  const message = event.data; // The JSON data our extension sent
  
			  document.getElementById('lines-of-code-counter').innerHTML = JSON.stringify(message, null, 2);
		  });
	  </script>
  </body>
  </html>`;
  }
