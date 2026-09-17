const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const html = readFileSync('index.html', 'utf8');
const code = html.split('<script>')[1].split('</script>')[0].replace(/boot\(\);\s*$/, '');
const result = new Function(`${code}
  const rows = [
    {id:'a',estado:'Pendiente',estadoDropi:'PENDIENTE'},
    {id:'b',estado:'En tránsito',estadoDropi:'GUIA_GENERADA'},
    {id:'c',estado:'Entregado',estadoDropi:'ENTREGADO',gananciaDropi:16.96},
    {id:'d',estado:'Entregado',estadoDropi:'ENTREGADO',estadoPagoDropi:'Pagado',fechaPagoDropi:'2026-09-17',montoPagadoDropi:16.96}
  ];
  STATE.pedidos = rows;
  return {
    statuses:DROPI_ESTADOS,
    alias:dropiStatusOptions('EN DISTRIBUCI�N A CLIENTE'),
    colors:[dropiStatusClass('ENTREGADO'),dropiStatusClass('GUIA_GENERADA'),dropiStatusClass('DEVOLUCION'),dropiStatusClass('NOVEDAD')],
    delivered:mapEstadoDropiExport('ENTREGADO'),
    pending:mapEstadoDropiExport('PENDIENTE'),
    confirmedTab:pedidosForTab('confirmado').map(x=>x.id),
    paymentTab:pedidosForTab('pagado').map(x=>x.id),
    pendingPaymentTab:pedidosForTab('por_conciliar').map(x=>x.id),
    fakePaid:pagoDropiConfirmado(rows[2]),
    paid:pagoDropiConfirmado(rows[3]),
    paymentCell:pagoCell(rows[2]),
    referenceCell:referenciasCell({id:'a',dropiId:'',fechaGuiaDropi:'',guia:''}),
    escapedReferenceCell:referenciasCell({id:'a',dropiId:'<b>',fechaGuiaDropi:'',guia:'" onfocus="bad'}),
    validReferences:referenciasError({id:'a',fecha:'2026-09-16'},'123','2026-09-17','GUIA123',rows),
    duplicateId:referenciasError({id:'a',fecha:'2026-09-16'},'987','2026-09-17','GUIA123',[...rows,{id:'e',dropiId:'987'}]),
    incompleteGuide:referenciasError({id:'a',fecha:'2026-09-16'},'123','','GUIA123',rows),
    earlyGuide:referenciasError({id:'a',fecha:'2026-09-16'},'123','2026-09-15','GUIA123',rows),
    invalidId:referenciasError({id:'a',fecha:'2026-09-16'},'12a','','',rows)
  };
`)();

assert.equal(result.statuses.length, 15);
assert.equal(result.statuses[0], 'PENDIENTE');
assert.match(result.alias, /EN DISTRIBUCIÓN A CLIENTE/);
assert.deepEqual(result.colors, ['entregado', 'transito', 'devuelto', 'confirmado']);
assert.equal(result.delivered, 'Entregado');
assert.equal(result.pending, 'Pendiente');
assert.deepEqual(result.confirmedTab, []);
assert.deepEqual(result.paymentTab, ['d']);
assert.deepEqual(result.pendingPaymentTab, ['c']);
assert.equal(result.fakePaid, false);
assert.equal(result.paid, true);
assert.match(result.paymentCell, /Sin conciliar/);
assert.match(result.referenceCell, /Guardar referencias/);
assert.doesNotMatch(result.escapedReferenceCell, /<b>/);
assert.doesNotMatch(result.escapedReferenceCell, /" onfocus="bad/);
assert.equal(result.validReferences, '');
assert.match(result.duplicateId, /ya pertenece/);
assert.match(result.incompleteGuide, /juntos/);
assert.match(result.earlyGuide, /anterior/);
assert.match(result.invalidId, /solo números/);
console.log('Estados, referencias y pago Dropi: pruebas correctas.');
