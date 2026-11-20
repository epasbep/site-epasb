// O antigo endereço "Consultar pedido" passou para a página de Atendimento (caixa "Consultar pedido").
// Esta página só reencaminha, mantendo o número (?n=…), para os links antigos continuarem a funcionar.
export default function Pedido() {
  const n = new URLSearchParams(location.search).get('n');
  location.replace(`contacto${n ? `?n=${encodeURIComponent(n)}` : ''}#consultar`);
  return null;
}
