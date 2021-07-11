import React, { useState, useEffect } from 'react';

export type AppContext = {
    currentNodeTitle: string,
    currentNodeAnchor: string,
    currentSelectedText: string,
    linkRenderer: (link: string, text:string) => string,
    onLinkClicked: (link: string) => void,
};

export default React.createContext<AppContext>({
    currentNodeTitle: '',
    currentNodeAnchor: '',
    currentSelectedText: '',
    linkRenderer: (link, text) => { return `<a href="${link.split('"').join('&quot;')}">${text}</a>`; },
    onLinkClicked: (link) => {}
});