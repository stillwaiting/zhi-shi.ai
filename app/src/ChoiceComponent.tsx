import React, { ReactElement, useState } from "react";
import Browser from "./browser/Browser";
import TrainerAppComponent from './trainer/TrainerAppComponent';

const choices: { [name: string]: ReactElement} = {
    'browser': <Browser />,
    'Russian': <TrainerAppComponent url={'/RUv2.md'} />
}

export default () => {
    const [selected, setSelected] = useState<string>("");
    return <div>
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