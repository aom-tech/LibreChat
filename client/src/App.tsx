import React from 'react';
import YandexMetrica from '~/components/YandexMetrica';

function App() {
  return (
    <div className="App">
      {/* Add Yandex Metrica */}
      {process.env.REACT_APP_YANDEX_METRICA_ID && (
        <YandexMetrica counterId={process.env.REACT_APP_YANDEX_METRICA_ID} />
      )}

      {/* ...existing code... */}
    </div>
  );
}

export default App;
