export default function AjudaPage() {
  return (
    <div>
      <section className="card">
        <h1 className="section-title">Ajuda</h1>
        <p className="meta">Como cadastrar jogador, criar a partida e marcar o jogo.</p>
      </section>

      <section className="card">
        <h2 className="section-title">Vídeo: criar a partida e marcar</h2>
        <p className="meta">Quarenta e dois segundos. Dá para assistir no celular e encaminhar o arquivo.</p>
        <video className="ajuda-video" controls playsInline preload="metadata" src="/videos/como-marcar-uma-partida.mp4">
          Seu navegador não reproduziu o vídeo.
        </video>
        <p className="meta">
          <a href="/videos/como-marcar-uma-partida.mp4" download>
            Baixar o vídeo
          </a>
        </p>
      </section>

      <section className="card">
        <h2 className="section-title">1. Entrar</h2>
        <ol className="ajuda-lista">
          <li>Abra o site no celular ou no computador.</li>
          <li>Toque em <strong>Login</strong>.</li>
          <li>Informe e-mail e senha e toque em <strong>Entrar</strong>.</li>
        </ol>
        <p className="meta">O nome aparece no canto da tela. Para sair, abra esse menu e toque em <strong>Sair</strong>.</p>
        <p className="meta">É preciso estar logado para cadastrar jogador, criar partida e marcar o jogo. Estatísticas e desculpas podem ser vistas sem login.</p>
      </section>

      <section className="card">
        <h2 className="section-title">2. Cadastrar jogador</h2>
        <ol className="ajuda-lista">
          <li>Abra <strong>Jogadores</strong>.</li>
          <li>Espere a lista carregar. O cadastro fica bloqueado até ela terminar.</li>
          <li>Digite o nome.</li>
          <li>Em <strong>Mensalista</strong>, escolha <strong>Sim</strong> para quem joga toda semana ou <strong>Não</strong> para avulso.</li>
          <li>Toque em <strong>Salvar</strong>.</li>
        </ol>
        <p className="meta">O nome não pode repetir o de outro jogador. Para corrigir nome ou tipo, toque em <strong>Editar</strong>, ajuste e salve.</p>
        <p className="meta">Use <strong>Filtrar</strong> para achar alguém. Mensalistas e avulsos ficam em listas separadas.</p>
      </section>

      <section className="card">
        <h2 className="section-title">3. Criar a partida</h2>
        <ol className="ajuda-lista">
          <li>Abra <strong>Nova Partida</strong>.</li>
          <li>Confira a <strong>data</strong> e o <strong>local</strong>.</li>
          <li>
            Monte os times: escolha o jogador e o time, ou toque em <strong>Preencher com mensalistas</strong>.
          </li>
          <li>Cada time precisa ter pelo menos 5 jogadores e no máximo 10.</li>
          <li>Se alguém ficou no lado errado, use <strong>Mover para A</strong> ou <strong>Mover para B</strong>.</li>
          <li>
            <strong>Fixar</strong> segura o jogador naquele time quando você usar <strong>Equilibrar times</strong>. O equilíbrio reparte os demais pela média do ano.
          </li>
          <li>Toque em <strong>Salvar partida</strong>.</li>
        </ol>
        <p className="meta">A partida nasce em aberto, com o placar zerado.</p>
      </section>

      <section className="card">
        <h2 className="section-title">4. Marcar o jogo</h2>
        <p className="meta">
          Na lista de <strong>Partidas</strong>, a partida em aberto tem o botão <strong>Tela cheia</strong>. Use esse botão no celular, de preferência na beira do campo.
        </p>
        <p>A tela mostra os dois times lado a lado. Em cada jogador há três números:</p>
        <ul className="ajuda-legenda">
          <li><i className="gol" /> verde: gol</li>
          <li><i className="assistencia" /> amarelo: assistência</li>
          <li><i className="contra" /> vermelho: gol contra</li>
        </ul>
        <p className="meta">Um toque soma 1. O gol contra entra no placar do outro time. Enquanto essa tela estiver aberta, o celular tenta não apagar a tela sozinho.</p>
        <h3>Corrigir um lance</h3>
        <p className="meta">
          Segure o <strong>nome</strong> do jogador por 3 segundos. Abre o ajuste de gols, assistências e gols contra daquele jogador. Use menos e mais e toque em <strong>Salvar</strong>. <strong>Cancelar</strong> descarta a mudança.
        </p>
        <h3>Encerrar</h3>
        <ol className="ajuda-lista">
          <li>Toque em <strong>Encerrar partida</strong>.</li>
          <li>Escolha o <strong>melhor da partida</strong>. Sem isso o botão de confirmar fica desligado.</li>
          <li>A <strong>bola murcha</strong> é opcional. Deixe <strong>Nenhum</strong> se não houver.</li>
          <li>Toque em <strong>Confirmar</strong>.</li>
        </ol>
        <p className="meta">
          A partida passa a encerrada. O placar, o melhor da partida e a bola murcha aparecem no card. <strong>Fechar</strong>, no alto da tela cheia, sai da marcação sem encerrar. O que já foi marcado continua salvo.
        </p>
      </section>

      <section className="card">
        <h2 className="section-title">5. Estatísticas e desculpas</h2>
        <p className="meta">
          Em <strong>Estatisticas</strong>, escolha o período e toque em <strong>Atualizar</strong>. Dá para ordenar por gols, assistências, jogos, vitórias e os outros números.
        </p>
        <p className="meta">
          Em <strong>Desculpas</strong>, registre quem avisou que não vai. Informe o jogador, a data e o motivo.
        </p>
      </section>

      <section className="card">
        <h2 className="section-title">6. Jogo avulso</h2>
        <p className="meta">
          <strong>Avulsas</strong> é uma lista à parte, para jogo que não entra na pelada da semana. Informe nome, local e data e toque em <strong>Criar</strong>. <strong>Encerrar</strong> marca que aquele jogo avulso acabou. Ele não mistura com o placar das partidas normais.
        </p>
      </section>
    </div>
  );
}
