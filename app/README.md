# Getting Started with Create React App

### Building the user-facing website

1. `nvm use`

2. `cd app`

3. `REACT_APP_LANG=ru yarn build`

4. deploy app/build to netlify

### Building the vscode extention

See [vscode-ext readme](../vscode-ext/zhishimd/README.md)




### Markdown conventions

```
# Anything, not visible on website

## Anything, not viible on website

### ....


#### Topic, the whole title is visible on website

##### Rule: The name of the rule that is visible on the website, "Rule:" prefix is removed

/* Nodes with titles containing [nr] or [todo] are ignored.  */

/* Also, the rule name might contain [debug] flag, in this case the rule will appear on website
   only in debug mode:
        window.localStorage.setItem("debug", 1)
*/

###### Task: subset of tasks1

? my question (choice1|choice2)
! my answer

? my question2 (choice1|choice2)
! my answer2

###### Task: subset of task2

...

##### Rule: another rule

...

```

