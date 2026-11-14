// Arranque comum a todas as páginas: estilos + React.
// Páginas públicas recebem o nome da página (para o menu) e ganham cabeçalho e rodapé.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './estilos.css';
import { Layout } from './componentes/Layout.jsx';

export function montar(pagina, nome) {
  createRoot(document.getElementById('raiz')).render(
    <StrictMode>{nome ? <Layout pagina={nome}>{pagina}</Layout> : pagina}</StrictMode>
  );
}
