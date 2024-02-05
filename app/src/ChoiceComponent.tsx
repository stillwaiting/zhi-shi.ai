import React, { ReactElement, useState } from "react";
import Browser from "./browser/Browser";
import TrainerAppComponent from './trainer/TrainerAppComponent';
import LANGUAGE_RU from './trainer/LanguageRu';

const choices: { [name: string]: ReactElement} = {
    'browser-ru': <Browser url={'/RUv2.md'}/>,
    'trainer-app-ru': <TrainerAppComponent url={'/RUv2.md'}  lang={LANGUAGE_RU} />
}

function getDefaultSelected() {
    if (window.location.search.indexOf('browser') >= 0) {
        return 'browser-ru';
    }
    if (window.location.href.indexOf('zhi-shi') >= 0) {
        return 'trainer-app-ru';
    }
    return '';
}

export default () => {
    const [selected, setSelected] = useState<string>(getDefaultSelected());
    return <div className="choice">
        {!selected
         ? <div>
                {Object.keys(choices).map((choiceName: string) =>
                    <p key={choiceName}>
                        <a href='#' onClick={
                            (e) => {
                                e.preventDefault();
                                setSelected(choiceName);
                            }
                            }>{choiceName}</a>
                    </p>
                )}
            </div>
        : choices[selected]
        }
    </div>;
}