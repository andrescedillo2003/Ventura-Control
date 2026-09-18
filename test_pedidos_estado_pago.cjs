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
    referenceCell:referenciasCells({id:'a',dropiId:'',fechaGuiaDropi:'',guia:''}),
    escapedReferenceCell:referenciasCells({id:'a',dropiId:'<b>',fechaGuiaDropi:'',guia:'" onfocus="bad'}),
    validReferences:referenciasError({id:'a',fecha:'2026-09-16'},'123','2026-09-17','GUIA123',rows),
    duplicateId:referenciasError({id:'a',fecha:'2026-09-16'},'987','2026-09-17','GUIA123',[...rows,{id:'e',dropiId:'987'}]),
    incompleteGuide:referenciasError({id:'a',fecha:'2026-09-16'},'123','','GUIA123',rows),
    earlyGuide:referenciasError({id:'a',fecha:'2026-09-16'},'123','2026-09-15','GUIA123',rows),
    invalidId:referenciasError({id:'a',fecha:'2026-09-16'},'12a','','',rows),
    wallet:compareWalletCredits(parseWalletCredits('transaccion\\tfecha\\tpedido_id\\tguia\\timporte\\n999\\t2026-09-17\\t7022555\\t189778915\\t16.96\\n998\\t2026-09-17\\t7022495\\tBAD\\t15.11'),[
      {id:'x',dropiId:'7022555',guia:'189778915',estado:'Entregado',precioVenta:34.99,costoProducto:13,costoEnvio:5.03,gananciaDropi:0},
      {id:'y',dropiId:'7022495',guia:'189779936',estado:'Entregado',precioVenta:32.99,costoProducto:10,costoEnvio:7.88,gananciaDropi:0}
    ]),
    wrongAmount:compareWalletCredits(parseWalletCredits('transaccion\\tfecha\\tpedido_id\\tguia\\timporte\\n999\\t2026-09-17\\t7022555\\t189778915\\t16.95'),[
      {id:'x',dropiId:'7022555',guia:'189778915',estado:'Entregado',precioVenta:34.99,costoProducto:13,costoEnvio:5.03,gananciaDropi:0}
    ])
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
assert.match(result.referenceCell, /data-ref-fecha/);
assert.match(result.referenceCell, /data-ref-guia/);
assert.match(result.referenceCell, /data-save-ref/);
assert.doesNotMatch(result.escapedReferenceCell, /<b>/);
assert.doesNotMatch(result.escapedReferenceCell, /" onfocus="bad/);
assert.equal(result.validReferences, '');
assert.match(result.duplicateId, /ya pertenece/);
assert.match(result.incompleteGuide, /juntos/);
assert.match(result.earlyGuide, /anterior/);
assert.match(result.invalidId, /solo números/);
assert.equal(result.wallet.accepted.length, 1);
assert.equal(result.wallet.rejected.length, 1);
assert.equal(result.wallet.accepted[0].entry.importe, 16.96);
assert.match(result.wallet.rejected[0].reason, /Guía distinta/);
assert.match(result.wrongAmount.rejected[0].reason, /Importe distinto/);
console.log('Estados, referencias y pago Dropi: pruebas correctas.');
