import { createElement, useEffect } from 'react';
import ReactCurse, { Text } from 'react-curse';

const _ = createElement;

const App = () => {
  useEffect(() => setTimeout(() => { ReactCurse.exit(); }, 0) && undefined, []);
  return (_(Text, { color: "red" }, "HI"));
}

console.log('line 1');
ReactCurse.inline(_(App, {}));
console.log('line 2');
