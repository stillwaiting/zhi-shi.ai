import React, { useState, useEffect, useContext } from 'react';
import './NodeHeaderComponent.scss';

type NodeHeaderComponent = {
    path: Array<string>,
    onTitleClicked: (title: string) => void
};

export default ( { path, onTitleClicked }: NodeHeaderComponent ) => {
    return <div className='NodeHeaderComponent' data-testid='NodeHeaderComponent'>
        {path.map((pathItem, index) => {
            return <span key={`pathItem${index}`}> 
                    <span className='separator'>/</span>
                <a href='#' onClick={(e) => {
                        e.preventDefault();
                        onTitleClicked(pathItem);
                }}>{pathItem}</a>
            </span>;
        })}
    </div>;
}
