export function formatNumber(numberToFormat: number): string {
    const newString = numberToFormat.toString().split(".");
    return newString.length > 1
        ? newString[0] +
              (newString[1].length > 2
                  ? "." + newString[1].slice(0, 3)
                  : "." + newString[1])
        : numberToFormat.toString();
}
