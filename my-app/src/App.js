import React from 'react';
import './App.css';
import Header from "./mycomponents/Header";
import Todos from "./mycomponents/Todos";


function App() {
  return (
    let todos=[
      {

      },{

      },{
          
      },
  ]
    <>
      <Header title="New" Extras={false} />
      <Todos todos={todos}/>
    </>
  );
}

export default App;
