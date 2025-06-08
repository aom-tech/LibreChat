import Amplitude from './Amplitude';
import YandexMetrica from './YandexMetrica';

const SCRIPT_YANDEX_METRICA_ID = import.meta.env.SCRIPT_YANDEX_METRICA_ID;
const SCRIPT_AMPLITUDE_API_KEY = import.meta.env.SCRIPT_AMPLITUDE_API_KEY;

const Scripts = () => {
  return (
    <>
      {/* Add Yandex Metrica */}
      {SCRIPT_YANDEX_METRICA_ID && <YandexMetrica counterId={SCRIPT_YANDEX_METRICA_ID} />}
      {/* Add Amplitude */}
      {SCRIPT_AMPLITUDE_API_KEY && <Amplitude apiKey={SCRIPT_AMPLITUDE_API_KEY} />}
    </>
  );
};

export default Scripts;
