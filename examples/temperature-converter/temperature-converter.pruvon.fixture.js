import * as temperatureConverter from './temperature-converter.js';

export function celsiusToFahrenheit(args) {
  return temperatureConverter.celsiusToFahrenheit(Number(args[0]));
}
