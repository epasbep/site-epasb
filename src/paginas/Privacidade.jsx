// Página "Política de Privacidade" (Lei n.º 22/11, de 17 de Junho — Lei da Protecção de Dados Pessoais).
import { Documento } from './Legal.jsx';
import { NOME } from '../componentes/Layout.jsx';
import { MORADA } from '../config.js';

const T = ({ children }) => <p className="texto">{children}</p>;

const SECCOES = [
  ['responsavel', 'Responsável pelo tratamento', <>
    <T>O responsável pelo tratamento dos dados pessoais recolhidos neste site é a {NOME} (EPASB-EP), com sede na {MORADA}, Angola.</T>
    <T>Para qualquer questão sobre os seus dados: <a href="mailto:geral@epasb.ao">geral@epasb.ao</a>.</T>
  </>],
  ['dados', 'Que dados recolhemos', <>
    <T>Só recolhemos dados quando envia um pedido de atendimento:</T>
    <ul className="documento__lista">
      <li>nome, email e telefone;</li>
      <li>assunto, mensagem e, se o juntar, um documento ou fotografia;</li>
      <li>data e hora do envio e o número do pedido.</li>
    </ul>
    <T>Não pedimos dados sensíveis (saúde, religião, opinião política e semelhantes). Pedimos que não os inclua na mensagem.</T>
  </>],
  ['finalidade', 'Para que usamos os dados', <>
    <T>Os dados servem apenas para tratar e responder ao seu pedido, contactá-lo sobre ele e, de forma anónima e só em números, produzir estatísticas sobre o atendimento.</T>
    <T>Não usamos os dados para publicidade nem os vendemos ou cedemos a terceiros.</T>
  </>],
  ['fundamento', 'Fundamento legal', <>
    <T>O tratamento baseia-se no seu consentimento, dado no formulário, e no exercício das funções de serviço público da EPASB-EP, nos termos da Lei n.º 22/11, de 17 de Junho (Lei da Protecção de Dados Pessoais).</T>
  </>],
  ['acesso', 'Quem tem acesso', <>
    <T>Só os trabalhadores da EPASB-EP responsáveis pelo atendimento e o administrador do sistema têm acesso aos pedidos. Os restantes trabalhadores do painel vêem apenas estatísticas, sem dados pessoais. Cada acesso exige conta própria e fica registado.</T>
    <T>Os dados ficam guardados num serviço de alojamento de bases de dados contratado pela EPASB-EP, que os trata apenas por conta da EPASB-EP. Os dados só são comunicados a outras entidades quando a lei o exigir (por exemplo, a pedido de um tribunal).</T>
  </>],
  ['prazo', 'Durante quanto tempo', <>
    <T>Os pedidos de atendimento e os documentos anexados são guardados durante <strong>2 anos</strong> após o envio e depois eliminados, salvo se a lei exigir um prazo maior ou se forem necessários para um processo em curso.</T>
  </>],
  ['seguranca', 'Segurança', <>
    <T>A ligação ao site é encriptada (HTTPS). Os documentos anexados não ficam públicos: só abrem por ligações temporárias, geradas para a equipa de atendimento. O painel administrativo exige palavra-passe, regras de acesso por função e termina a sessão automaticamente quando não é usado.</T>
  </>],
  ['direitos', 'Os seus direitos', <>
    <T>Pode, a qualquer momento:</T>
    <ul className="documento__lista">
      <li>saber que dados seus temos e pedir uma cópia;</li>
      <li>pedir a correcção de dados errados;</li>
      <li>pedir a eliminação dos seus dados ou retirar o consentimento, sem afectar o tratamento já feito;</li>
      <li>opor-se ao tratamento, nos casos previstos na lei.</li>
    </ul>
    <T>Envie o pedido para <a href="mailto:geral@epasb.ao">geral@epasb.ao</a>, indicando o número do pedido de atendimento, se o tiver. Pode também apresentar queixa à Agência de Protecção de Dados (APD).</T>
  </>],
  ['cookies', 'Cookies e estatísticas de visitas', <>
    <T>O site não usa cookies de publicidade. Para contar as visitas usamos o Google Analytics, que guarda cookies com um identificador aleatório e recolhe dados técnicos (páginas visitadas, tipo de dispositivo, cidade aproximada). Esta informação é usada apenas em números globais, para melhorar o site.</T>
    <T>O site guarda também, no seu próprio browser, os avisos que fechou, para não os mostrar de novo. Pode apagar estes dados nas definições do browser.</T>
  </>],
  ['alteracoes', 'Alterações a esta política', <>
    <T>Esta política pode ser actualizada. A versão em vigor é sempre a publicada nesta página. Ver também os <a href="termos">Termos de Utilização</a>.</T>
  </>]
];

export default function Privacidade() {
  return (
    <Documento
      eyebrow="Informação legal · Lei n.º 22/11"
      titulo="Política de Privacidade"
      lead="Como a EPASB-EP recolhe, usa e protege os dados pessoais enviados através deste site."
      seccoes={SECCOES}
    />
  );
}
