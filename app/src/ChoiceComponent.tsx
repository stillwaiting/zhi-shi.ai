import React, { ReactElement, useState } from "react";
import Browser from "./browser/Browser";
import TrainerAppComponent from './trainer/TrainerAppComponent';
import LANGUAGE_RU from './trainer/LanguageRu';

const choices: { [name: string]: ReactElement} = {
    'browser': <Browser />,
    'Russian': <TrainerAppComponent url={'/RUv2.md'}  lang={LANGUAGE_RU} />
}

export default () => {
    const [selected, setSelected] = useState<string>(window.location.href.indexOf('zhi-shi') > 0 ? 'Russian' : '');
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