export function buildString(str: TemplateStringsArray, ...args: any[]): string {
  let result = str[0]; // Начинаем с первой части строки
  
  for (let i = 0; i < args.length; i++) {
    const add = args[i] + str[i + 1];
    result += (add == 'undefined' ? "" : add)
  }

  return result;
}
