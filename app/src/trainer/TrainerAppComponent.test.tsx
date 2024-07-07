import React from "react";
import { History } from 'history';
import { expect } from '@jest/globals';
import { fireEvent, render, RenderResult, screen, cleanup, act } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import TrainerAppComponent, {clearAnswersInLocalStorage} from './TrainerAppComponent';
import { MemoryRouter } from 'react-router';
import { Link, Route } from "react-router-dom";
import lang from './LanguageEn';
import TaskSuggester from "./TaskSuggester";
import Hasher from "./Hasher";

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function answerCorrectly(component: RenderResult) {
    const firstSelect = component.container.getElementsByTagName('select')[0]
    fireEvent.change(firstSelect, {
        target: {value: 0}
    });
}


describe('TrainerAppComponent', () => {

    let currentPath: string = '/';
    let currentHistory: History;

    const data = `

# Root

## Rule blah

### Task node 3

Some text that should be ignored.

? 6 (foo|bar)
! answer 0

## Rule blah2

### Task node 4

? 7 (hello|world)
! answer 1
            `;
    const taskSuggester = new TaskSuggester(data);
    const hasher = new Hasher();
    taskSuggester.getTopics().forEach(topic => {
        topic.rules.forEach(rule => {
            hasher.addRule(rule);
            rule.taskIdxs.forEach(taskIdx => {
                hasher.addTask(taskSuggester.getTask(taskIdx));
            })
        });
    });


    async function renderAndWaitForData(): Promise<RenderResult> {
        const view = render(<MemoryRouter initialEntries={[currentPath]}>
            <TrainerAppComponent url='/foo' lang={lang} analyticsManager={undefined} />

            <Route
                path="*"
                render={({ history, location }) => {
                    currentPath = location.pathname;
                    currentHistory = history;
                    return null;
                }}
            />
            <Link data-testid='goto1' to={`/rules/${hasher.ruleIdxToHash(1)}/task/${hasher.taskIdxToHash(1)}`}>goto 1</Link>
            <Link data-testid='goto0' to={`/rules/${hasher.ruleIdxToHash(0)}/task/${hasher.taskIdxToHash(0)}`}>goto 0</Link>
            <Link data-testid='goto' to='/'>goto root</Link>

            </MemoryRouter>)
        await act(async () => { await sleep(1); });
        return view;
    }


    beforeEach(() => {
        currentPath = '/'
        clearAnswersInLocalStorage();
        fetchMock.enableMocks();

        fetchMock.mockResponse(data);
    });

    afterEach(() => {
        fetchMock.disableMocks();
        cleanup();
    });

    test('shows browser warning', async () => {
        const view = await renderAndWaitForData();
        expect(view.getByTestId('BrowserWarning')).toBeDefined();
    });


    test('downloads data and then shows the task', async () => {
        const view = await renderAndWaitForData();

        if (view.container.innerHTML.indexOf('hello') >= 0) {
            expect(view.getByText('hello')).toBeDefined();
        } else {
            expect(view.getByText('foo')).toBeDefined();
        }
    });

    test('gets selected rules from path', async() => {
        currentPath = '/rules/' + hasher.ruleIdxToHash(1);

        const component = await renderAndWaitForData();

        for (let idx = 0; idx < 100; idx++) {
            answerCorrectly(component);
            fireEvent.click(component.getByText('Check'));
            fireEvent.click(component.getByText('Next task'));
            expect(component.getByText('world')).toBeDefined();
        }
    });

    test('next records answer and opens another task', async () => {
        const component = await renderAndWaitForData();

        const hasWorld1 = component.container.innerHTML.indexOf('world') >= 0;
        answerCorrectly(component);
        fireEvent.click(component.getByText('Check'));
        fireEvent.click(component.getByText('Next task'));
        const hasWorld2 = component.container.innerHTML.indexOf('world') >= 0;
        expect(new Set<boolean>([hasWorld1, hasWorld2])).toStrictEqual(new Set<boolean>([true, false]));
    });

    test('updates selected rule when path changes', async() => {
        const component = await renderAndWaitForData();

        const hasWorld1 = component.container.innerHTML.indexOf('world') >= 0;

        fireEvent.click(component.getByTestId(hasWorld1 ? 'goto0' : 'goto1'));

        const hasWorld2 = component.container.innerHTML.indexOf('world') >= 0;
        expect(new Set<boolean>([hasWorld1, hasWorld2])).toStrictEqual(new Set<boolean>([true, false]));
    });

    test('resets answer when the paths changes', async() => {
        const component = await renderAndWaitForData();

        fireEvent.click(component.getByText('goto 0'));

        answerCorrectly(component);
        fireEvent.click(component.getByText('Check'));

        fireEvent.click(component.getByText('goto 1'));

        expect(component.queryByText('Next task')).toBeNull();
    });

    test('filter link becomes active when clicked', async () => {
        const component = await renderAndWaitForData();
        fireEvent.click(component.getByText('Change'));
        expect(currentPath).toContain('/filter');
        expect(component.getByText('Change').className).toBe('active');
    });

    test('filter refreshes stats', async () => {
        const component = await renderAndWaitForData();

        answerCorrectly(component);
        fireEvent.click(component.getByText('Check'));

        expect(component.getByText('100%')).toBeDefined();
    });

    test('navigating to filter and back doesn not reset answer state', async () => {
        const component = await renderAndWaitForData();

        fireEvent.click(component.getByText('goto 0'));

        answerCorrectly(component);
        fireEvent.click(component.getByText('Check'));

        console.log("at 1");
        fireEvent.click(component.getByTestId('filter-link'));
        console.log("at 2");
        fireEvent.click(component.getByText('goto 0'));
        console.log("at 3");

        expect(component.getByText('answer 0')).toBeDefined();
    });

    test('renders adjacent nodes if exist', async () => {
        fetchMock.resetMocks();
        fetchMock.mockResponse(`
# Root

## Rule blah

{connected:Rule blah2}

### Task node 3

Some text that should be ignored.

? 6 (foo|bar)
! answer 0

## Rule blah2

### Task node 4

? 7 (hello|world)
! answer 1
                    `);
        const component = await renderAndWaitForData();

        fireEvent.click(component.getByText('goto 0'));

        answerCorrectly(component);
        fireEvent.click(component.getByText('Check'));

        expect(component.container.innerHTML).toContain('Adjacent topics');
    });

    test('does not render adjacent nodes if not exist', async () => {
        const component = await renderAndWaitForData();

        fireEvent.click(component.getByText('goto 0'));

        answerCorrectly(component);
        fireEvent.click(component.getByText('Check'));

        expect(component.container.innerHTML).not.toContain('Adjacent topics');
    });

    test('going back resets the task answer', async () => {
        const component = await renderAndWaitForData();
        fireEvent.click(component.getByText('goto 0'));
        fireEvent.click(component.getByText('goto 1'));
        answerCorrectly(component);
        fireEvent.click(component.getByText('Check'));
        expect(component.queryByText('Next task')).toBeDefined();
        currentHistory.goBack();
        await act(async () => { await sleep(1); });
        expect(component.queryByText('Next task')).toBeNull();
    });
});