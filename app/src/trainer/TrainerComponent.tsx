import BrowserWarningComponent from "./BrowserWarningComponent";
import DataProviderComponent from "./DataProviderComponent";

export default function() {
    return <div className='TrainerComponent'>
        <BrowserWarningComponent />
        <DataProviderComponent url={process.env.PUBLIC_URL + '/asdas'} onDataProvided={() =>{}} />
    </div> 
}