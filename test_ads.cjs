const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');
const code = html.split('<script>')[1].split('</script>')[0].replace(/boot\(\);\s*$/, '');
const metric = new Function(`${code}
  return computeMetrics(
    [{estado:'Entregado',dropiId:'1',gananciaDropi:100,precioVenta:200,costoProducto:50,costoEnvio:20,estadoDropi:'ENTREGADO'}],
    [],
    [{tipo:'Campaña',monto:30},{tipo:'Otro',monto:5}]
  );
`)();

assert.equal(metric.utilidadDropi, 100);
assert.equal(metric.gastoAds, 30);
assert.equal(metric.utilidadNeta, 65);
console.log('Gastos de ads descontados correctamente de utilidad Dropi.');
