import React, { useState, useEffect } from 'react';

export type AppContext = {
    currentNodeTitle: string,
    currentNodeAnchor: string,
    currentSelectedText: string,
    onLinkClicked: (link: string) => void,
};

export default React.createContext<AppContext>({
    currentNodeTitle: '',
    currentNodeAnchor: '',
    currentSelectedText: '',
    onLinkClicked: (link) => {}
});