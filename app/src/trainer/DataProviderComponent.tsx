//process.env.PUBLIC_URL

import { useEffect, useState } from "react";
import './DataProviderComponent.scss';
import React from 'react';

type Props = {
    url: string,
    onDataProvided: (data: string) => void
}

export default function DataProviderComponent({url, onDataProvided} : Props) {
    const [data, setData] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [attempt, setAttempt] = useState<number>(1);

    function tryAgain() {
        setError('');
        setAttempt(attempt + 1);
    }

    useEffect(() => {
        let cancelled = false;

        fetch(url).then(response => {
            if (response.status == 200) {
                return response.text()
            } else {
                throw `something went wrong (${response.status})`;
            }
        })
        .then(text => {
            if (!cancelled) {
                setData(text);
                onDataProvided(text);
            }
        })
        .catch(e => {
            if (!cancelled) {
                setError('' + e);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [attempt]);
    
    if (data) {
        return null;
    } else if (error) {
        return <div className='DataProviderComponent'>
            <div className='error'>Error: {error}</div>
            <div className='try again'><a href='#' onClick={
                (e) => {
                    e.preventDefault();
                    tryAgain();
                }
            }>try again</a></div>
        </div>
    } else {
        return <div className='DataProviderComponent'>
            <div className='loading'>Loading...</div>
        </div>
    }
}