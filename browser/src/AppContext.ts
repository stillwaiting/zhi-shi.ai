import React, { useState, useEffect } from 'react';

export type AppContext = {
    currentNodeAnchor: string,
    currentSelectedText: string,
    linkRenderer: (link: string, text:string) => string,
    onLinkClicked: (link: string, e: React.MouseEvent<HTMLElement>) => void,
};

export default React.createContext<AppContext>({
    currentNodeAnchor: '',
    currentSelectedText: '',
    linkRenderer: (link, text) => { return `<a href="${link.split('"').join('&quot;')}">${text}</a>`; },
    onLinkClicked: (link) => {},
});