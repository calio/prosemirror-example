// App.js
import React from 'react';
import Editor from './Editor';

function App() {
  return (
    <div className="App">
      <div id="content" style={{display: "none"}}>Hello World!</div>
      <Editor />
    </div>
  );
}

export default App;

