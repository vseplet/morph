export function buildString(str: TemplateStringsArray, ...args: any[]): string {
  let result = str[0]; // Начинаем с первой части строки
  for (let i = 0; i < args.length; i++) {
    result += args[i] + str[i + 1];
  }
  return result;
}
