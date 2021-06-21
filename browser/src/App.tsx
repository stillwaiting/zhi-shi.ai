import React, { useState } from 'react';
import logo from './logo.svg';
import './App.scss';
import SentenceComponent from './SentenceComponent'
import QuestionAnswerComponent from './QuestionAnswerComponent';
import TopicsTreeComponent from './TopicsTreeComponent';
import parse, { MarkdownNode } from './MarkdownParser';

function App() {
  const [unsubmittedData, setUnsubmittedData] = useState<string>("");
  const [nodes, setNodes] = useState<MarkdownNode[]>([]);

  const onDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUnsubmittedData(e.currentTarget.value);
  }

  const onSubmitClicked = () => {
    setNodes(parse(unsubmittedData));
  }

  return (
    <div className="App">
      <div className="topics">
        <TopicsTreeComponent nodes={nodes} />
      </div>

      <div className="content">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus consequat molestie nibh ac venenatis. Sed vel vestibulum ante, viverra suscipit elit. Duis nec dapibus sem. Donec id neque feugiat, efficitur nisl vel, ornare sem. Aenean venenatis augue tellus, vitae congue neque vestibulum eu. Sed a iaculis neque. Curabitur tincidunt cursus sollicitudin. Duis finibus vulputate luctus. Nunc ut malesuada nulla. Donec feugiat ante eget viverra rhoncus. Integer cursus enim vitae aliquet suscipit. Cras nisi urna, maximus eget leo at, ornare pharetra purus. Curabitur iaculis orci sit amet lacus bibendum, sit amet ultrices justo lobortis. Vivamus tempor mattis eros, vitae gravida nisi finibus vitae. Phasellus in leo luctus, faucibus risus ut, pulvinar massa. Nulla vel ex fringilla, hendrerit tellus nec, tempor est.

Nam velit ante, placerat eget tincidunt eu, commodo vitae diam. Cras id euismod turpis, vitae condimentum est. Etiam ac porta lectus, vitae pulvinar tortor. Nunc aliquet est sit amet lorem fermentum iaculis. Morbi id nunc vitae nibh varius aliquet placerat mollis mauris. Etiam suscipit, ex eu tempus mattis, dui neque sollicitudin tellus, nec molestie nibh orci vitae justo. Sed et justo tortor. Nam placerat enim vitae felis semper, quis faucibus velit volutpat. Vestibulum dictum tincidunt mi. Morbi quis sem tincidunt, dignissim libero sed, interdum tellus. Mauris porttitor sem eget dignissim luctus. Duis eget leo porttitor est faucibus fringilla. Quisque eu bibendum lorem, nec aliquam lacus. Cras vel pharetra mi. Aenean et mattis nisi, et vestibulum quam.

Sed facilisis diam quis nisl porta, et eleifend sem ornare. Maecenas quis dui risus. Vivamus euismod ultricies quam vitae congue. Nullam nisi arcu, posuere vitae tincidunt et, interdum non nunc. Vestibulum sed venenatis nunc. Aenean in lorem posuere, sodales quam sed, tempus eros. Aenean ac sollicitudin nunc. Nullam quis purus est. Maecenas at justo sit amet erat efficitur vestibulum. Mauris egestas feugiat maximus. Quisque sit amet felis dolor. Sed commodo vitae ipsum pretium ultricies. Duis efficitur sed nulla vel facilisis. Cras nec ligula libero.

Sed id aliquam nisl, vel cursus nibh. Praesent posuere est nisl. Aenean facilisis bibendum cursus. Aenean vulputate ligula in semper vehicula. Donec vitae cursus sapien, et facilisis libero. Suspendisse ut augue et eros feugiat dignissim. Sed imperdiet urna lacus, in ullamcorper mauris consectetur nec. Donec urna diam, porttitor id vestibulum non, mattis id justo. Integer ullamcorper velit sed tortor ultricies, ac semper sapien tempus.

Quisque vitae sem nec nisi pellentesque commodo. Proin eget nunc nibh. Fusce vel pretium neque. Cras mollis sem non molestie volutpat. Quisque a erat sollicitudin, feugiat purus eleifend, posuere nunc. Fusce consectetur nisl ut sem lobortis, ut pharetra odio commodo. Vestibulum porttitor luctus quam, eu porta lorem ullamcorper vel. Mauris quis cursus leo, nec semper sapien. Ut massa ante, elementum eget enim ut, pellentesque efficitur enim. Ut finibus tincidunt libero, non elementum erat. In suscipit aliquam tincidunt.</div>
      <hr />
      <textarea onChange={onDataChange} value={String(unsubmittedData)}></textarea>
      <br />
      <button onClick={onSubmitClicked}>Submit</button>
    </div>
  );
}

export default App;
