// Página "Termos de Utilização".
import { Documento } from './Legal.jsx';
import { NOME } from '../componentes/Layout.jsx';
import { TELEFONE } from '../config.js';

const T = ({ children }) => <p className="texto">{children}</p>;

const SECCOES = [
  ['objecto', 'Objecto', <>
    <T>Estes Termos regulam a utilização do site da {NOME} (EPASB-EP), disponível em www.epasb.ao. Ao utilizar o site, o utilizador aceita estes Termos. Se não concordar com eles, não deve utilizar o site.</T>
  </>],
  ['servico', 'O que o site oferece', <>
    <T>O site divulga informação institucional, notícias, avisos, projectos e serviços da EPASB-EP, e permite enviar pedidos de atendimento (pedidos de informação, reclamações, denúncias e sugestões) e consultar o seu estado.</T>
    <T>O site é gratuito e não exige registo. A área administrativa destina-se apenas a trabalhadores autorizados da EPASB-EP.</T>
  </>],
  ['uso', 'Utilização correcta', <>
    <T>O utilizador compromete-se a:</T>
    <ul className="documento__lista">
      <li>prestar informação verdadeira nos pedidos de atendimento;</li>
      <li>não enviar pedidos falsos, repetidos em massa, ofensivos ou com conteúdo ilegal;</li>
      <li>não anexar ficheiros com vírus ou documentos de terceiros sem autorização;</li>
      <li>não tentar aceder à área administrativa, a dados de outras pessoas ou aos sistemas da EPASB-EP sem autorização.</li>
    </ul>
    <T>A EPASB-EP pode recusar ou eliminar pedidos que não cumpram estas regras e comunicar às autoridades as situações que possam constituir crime.</T>
  </>],
  ['pedidos', 'Pedidos de atendimento', <>
    <T>Cada pedido recebe um número que permite consultar o seu estado e a resposta. Esse número deve ser guardado pelo utilizador e não deve ser partilhado.</T>
    <T>O envio de um pedido pelo site não substitui os prazos e procedimentos previstos na lei ou nos contratos de fornecimento. Para avarias e fugas urgentes, deve ligar para o {TELEFONE.visivel}.</T>
  </>],
  ['informacao', 'Informação publicada', <>
    <T>A EPASB-EP procura manter a informação do site exacta e actualizada. Os avisos de interrupção do abastecimento, horários e prazos são indicativos e podem mudar por motivos técnicos ou operacionais.</T>
    <T>Os documentos oficiais publicados no Diário da República prevalecem sobre qualquer resumo apresentado no site.</T>
  </>],
  ['propriedade', 'Propriedade dos conteúdos', <>
    <T>Os textos, fotografias, logótipos e restantes conteúdos do site pertencem à EPASB-EP ou são utilizados com autorização. Todos os direitos reservados.</T>
    <T>É permitido partilhar notícias e avisos com indicação da fonte e ligação para o site. Não é permitido usar o nome ou o logótipo da EPASB-EP de forma que sugira uma relação ou aprovação que não existe.</T>
  </>],
  ['ligacoes', 'Ligações para outros sites', <>
    <T>O site contém ligações para sites de outras entidades (por exemplo, ministérios, redes sociais ou mapas). A EPASB-EP não é responsável pelo conteúdo nem pelas regras de privacidade desses sites.</T>
  </>],
  ['responsabilidade', 'Responsabilidade', <>
    <T>A EPASB-EP faz o possível para que o site esteja sempre disponível e seguro, mas não garante que funcione sem interrupções ou erros. Na medida permitida por lei, a EPASB-EP não é responsável por danos resultantes de falhas temporárias do site ou da utilização indevida da informação nele publicada.</T>
  </>],
  ['privacidade', 'Dados pessoais', <>
    <T>O tratamento dos dados pessoais enviados através do site está descrito na <a href="privacidade">Política de Privacidade</a>.</T>
  </>],
  ['alteracoes', 'Alterações', <>
    <T>A EPASB-EP pode alterar estes Termos. A versão em vigor é sempre a publicada nesta página, com a data da última actualização.</T>
  </>],
  ['lei', 'Lei aplicável', <>
    <T>Estes Termos regem-se pela lei da República de Angola. Os litígios são resolvidos pelos tribunais competentes da comarca de Benguela, sem prejuízo dos meios de reclamação previstos na lei.</T>
    <T>Dúvidas sobre estes Termos: <a href="mailto:geral@epasb.ao">geral@epasb.ao</a>.</T>
  </>]
];

export default function Termos() {
  return (
    <Documento
      eyebrow="Informação legal"
      titulo="Termos de Utilização"
      lead="Regras de utilização do site da EPASB-EP e do atendimento ao cidadão online."
      seccoes={SECCOES}
    />
  );
}
