import React from "react";
import Bowser from "bowser"; 
import { useState } from "react";
import './BrowserWarningComponent.scss';

const browser = Bowser.getParser(window.navigator.userAgent);

export default function() {
    const supportsTextFragments = "fragmentDirective" in document;
    const [expandClicked, setExpandClicked] = useState<boolean>(false);
    function onExpandClick() {
        setExpandClicked(!expandClicked);
    }
    if (!supportsTextFragments) {
        return <div className='BrowserWarning' data-testid='BrowserWarning'>
            Your browser does not support links to text fragments! Deep linking is disabled. <a 
                href='#' onClick={onExpandClick}>{expandClicked ? 'Collapse.' : 'Expand.'}</a>
            
            {expandClicked 
                ? <div className='details'>
                    This website uses "links to text fragments" browser feature to redirect a user exactly to the relevant part of the grammar rule. Without this
                    support, it might be challenging for the user to identify the exact clause that should explain the reason behind a particular 
                    task they are observing.<br /><br />
                    Your browser is <strong>{browser.getBrowserName()}</strong>, version <strong>{browser.getBrowserVersion()}</strong>. <br />
                    See <a href="https://caniuse.com/url-scroll-to-text-fragment" target="_blank">the list of supported browsers</a> for more details. <br />
                </div>
                : null
            }
        </div>
    }
    return null;
}