import React, { ReactElement, useState } from "react";
import Browser from "./browser/Browser";


const choices: { [name: string]: ReactElement} = {
    'browser': <Browser />,
}

export default () => {
    const [selected, setSelected] = useState<string>("");
    return <div>
        {!selected
         ? <div>
                {Object.keys(choices).map((choiceName: string) =>
                    <p>
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