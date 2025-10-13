import { greet } from '@my-monorepo/shared';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>{greet('World')}</p>
      </header>
    </div>
  );
}

export default App;