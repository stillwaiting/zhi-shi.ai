import React from "react";
import { fireEvent, render, RenderResult, screen } from '@testing-library/react';
import BrowserWarningComponent from "./BrowserWarningComponent";

describe('BrowserWarningComponent', () => {
    afterEach(() => {
        delete document.fragmentDirective;
    })

    test('should render warning when no fragmentDirective exist', () => {
        const component = render(<BrowserWarningComponent />);
        expect(component.getByText('Expand.')).toBeDefined();
    });

    test('should not render when fragmentDirective exists', () => {
        document.fragmentDirective = '';
        const component = render(<BrowserWarningComponent />);
        expect(component.queryByText('Expand.')).toBeNull();
    });

    test('should render browser name when expand is clicked', () => {
        const component = render(<BrowserWarningComponent />);
        fireEvent.click(component.getByText('Expand.'));
        expect(component.getByText('Safari')).toBeDefined();
    });

    test('should collaps when collapse is clicked', () => {
        const component = render(<BrowserWarningComponent />);
        fireEvent.click(component.getByText('Expand.'));
        fireEvent.click(component.getByText('Collapse.'));
        expect(component.queryByText('Safari')).toBeNull();
    });
});