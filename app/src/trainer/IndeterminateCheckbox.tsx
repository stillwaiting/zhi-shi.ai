import React from 'react';
import { useRef, useEffect } from 'react';

export enum CheckboxState {
    CHECKED,
    UNCHECKED,
    INDETERMINATE
}

type CheckboxPropsType = {
    state: CheckboxState;
    debug: string;
    onClick?: () => void
}

// TODO: add tests
export default ({state, onClick, debug} : CheckboxPropsType) => {
    const checkRef = useRef<HTMLInputElement | null>(null);
  
    useEffect(() => {
        (checkRef.current! as HTMLInputElement).checked = (state === CheckboxState.CHECKED);
        (checkRef.current! as HTMLInputElement).indeterminate = (state === CheckboxState.INDETERMINATE);
    }, [state, debug, checkRef])
  
    return (
      <input
        type="checkbox"
        ref={checkRef}
        checked={state === CheckboxState.CHECKED}
        onChange={(e) => {
            if (onClick) {
                onClick();
            }
        }}
      />
    )
  }