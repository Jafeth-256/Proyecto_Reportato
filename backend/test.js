const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Ingresa un número: ', (numero) => {
  console.log(`El número ingresado es: ${numero}`);
  rl.close();
});