// Проверки полей на клиенте. Повторяют ограничения из задания;
// сервер проверяет всё повторно и возвращает свои сообщения.
// Каждая проверка возвращает true или текст ошибки (формат validate из react-hook-form).

export type Check = (value: unknown) => true | string;

const INT_MIN = -2147483648n;
const INT_MAX = 2147483647n;
const LONG_MIN = -9223372036854775808n;
const LONG_MAX = 9223372036854775807n;
const FLOAT_MAX = 3.4028234663852886e38;
const FLOAT_MIN_POSITIVE = 1.401298464324817e-45;

const INTEGER = /^[+-]?\d+$/;
const DECIMAL = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

export const INT_MAX_TEXT = INT_MAX.toString();
export const LONG_MAX_TEXT = LONG_MAX.toString();

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === '';
}

/** Проверка непустого значения; пустые значения пропускаются (для них есть required). */
function check(fn: (value: string) => true | string): Check {
  return (value) => (isEmpty(value) ? true : fn(String(value).trim()));
}

export const required: Check = (value) => (isEmpty(value) ? 'обязательное поле' : true);

/** «Поле не может быть null, строка не может быть пустой». */
export const notBlank: Check = (value) => (isEmpty(value) ? 'не может быть пустым' : true);

export const maxLength =
  (max: number): Check =>
  (value) =>
    typeof value === 'string' && value.length > max ? `длина не должна быть больше ${max}` : true;

function integerIn(min: bigint, max: bigint, typeName: string) {
  return check((value) => {
    if (!INTEGER.test(value)) {
      return 'должно быть целым числом';
    }
    const number = BigInt(value);
    return number < min || number > max ? `выходит за пределы типа ${typeName}` : true;
  });
}

export const int32 = integerIn(INT_MIN, INT_MAX, 'int');
export const int64 = integerIn(LONG_MIN, LONG_MAX, 'long');

export const float32 = check((value) => {
  if (!DECIMAL.test(value)) {
    return 'должно быть числом';
  }
  const number = Math.abs(Number(value));
  return number > FLOAT_MAX || (number !== 0 && number < FLOAT_MIN_POSITIVE) ? 'значение не представимо в типе float' : true;
});

export const float64 = check((value) => {
  if (!DECIMAL.test(value)) {
    return 'должно быть числом';
  }
  return Number.isFinite(Number(value)) ? true : 'значение не представимо в типе double';
});

export const positive = check((value) => (DECIMAL.test(value) && Number(value) > 0 ? true : 'должно быть больше 0'));

export const maxValue = (max: number) =>
  check((value) => (DECIMAL.test(value) && Number(value) > max ? `максимальное значение: ${max}` : true));

export const percent = check((value) =>
  DECIMAL.test(value) && Number(value) > 0 && Number(value) < 100 ? true : 'должно быть больше 0 и меньше 100',
);

/** Объединяет проверки в объект validate для react-hook-form. */
export function rules(...checks: Check[]) {
  return { validate: Object.fromEntries(checks.map((fn, index) => [`rule${index}`, fn])) };
}
