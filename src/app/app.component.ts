import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import axios from 'axios';

interface Atividade {
  id: number;
  descricao: string;
  conclusao: boolean;
  dataCriacao: Date;
  dataConclusao: Date | null;
}

const backendAPI = 'http://localhost:5000/api/todo';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class AppComponent implements OnInit {
  [x: string]: any;
  title = 'Quadro de Atividades';
  username = 'employee';
  password = 'employee_password';
  atividadesNaoConcluidas: Atividade[] = [];
  atividadesConcluidas: Atividade[] = [];
  novaAtividade = '';
  atividadeBuscada: Atividade | null = null;
  modalCriarAberto = false;
  modalEditarAberto = false;
  modalConfirmacao = false;
  atividadeParaEditar: Atividade | null = null;
  mensagemErro: string | null = null;
  acaoConfirmada: () => void = () => {};

  ngOnInit(): void {
    this.buscarAtividades();
  }

  async buscarAtividades() {
    try {
      const unfinishedResponse = await axios.get(`${backendAPI}/unfinished`, {
        auth: { username: this.username, password: this.password },
      });

      this.atividadesNaoConcluidas = Array.isArray(unfinishedResponse.data.data)
        ? unfinishedResponse.data.data
        : [];

      const finishedResponse = await axios.get(`${backendAPI}/finished`, {
        auth: { username: this.username, password: this.password },
      });

      this.atividadesConcluidas = Array.isArray(finishedResponse.data.data)
        ? finishedResponse.data.data
        : [];
    } catch (error) {
      this.exibirMensagemErro('Erro ao buscar atividades');
    }
  }

  async criarAtividade() {
    try {
      const response = await axios.post(
        `${backendAPI}/create`,
        {
          descricao: this.novaAtividade,
          dataCriacao: new Date(),
        },
        { auth: { username: this.username, password: this.password } }
      );
      this.atividadesNaoConcluidas.push(response.data);
      this.fecharModalCriar();
      await this.buscarAtividades();
    } catch (error) {
      this.exibirMensagemErro('Erro ao criar atividade');
    }
  }

  async concluirAtividade(atividade: Atividade) {
    try {
      const response = await axios.put(
        `${backendAPI}/finish/${atividade.id}`,
        {},
        {
          auth: { username: this.username, password: this.password },
        }
      );

      const atividadeConcluida: Atividade = response.data.data;
      this.atividadesConcluidas.push(atividadeConcluida);
      this.atividadesNaoConcluidas = this.atividadesNaoConcluidas.filter(
        (a) => a.id !== atividade.id
      );
    } catch (error) {
      this.exibirMensagemErro('Erro ao concluir atividade');
    }
  }
  async excluirAtividade(id: number) {
    try {
      await axios.delete(`${backendAPI}/delete/${id}`, {
        auth: { username: this.username, password: this.password },
      });
      this.atividadesNaoConcluidas = this.atividadesNaoConcluidas.filter(
        (a) => a.id !== id
      );
      this.atividadesConcluidas = this.atividadesConcluidas.filter(
        (a) => a.id !== id
      );
      this.fecharModalConfirmacao();
    } catch (error) {
      this.exibirMensagemErro('Erro ao excluir atividade');
    }
  }

  async editarAtividade() {
    if (!this.atividadeParaEditar) return;
    try {
      const response = await axios.put(
        `${backendAPI}/edit`,
        {
          id: this.atividadeParaEditar.id,
          descricao: this.atividadeParaEditar.descricao,
        },
        { auth: { username: this.username, password: this.password } }
      );

      const atividadeEditada: Atividade = response.data.data;
      this.atividadesNaoConcluidas = this.atividadesNaoConcluidas.map((a) =>
        a.id === this.atividadeParaEditar?.id ? atividadeEditada : a
      );
      this.fecharModalEditar();
      this.fecharModalConfirmacao();
    } catch (error) {
      this.exibirMensagemErro('Erro ao editar atividade');
    }
  }

  async buscarAtividadePorId(id: number) {
    try {
      const response = await axios.get(`${backendAPI}/${id}`, {
        auth: { username: this.username, password: this.password },
      });
      this.atividadeBuscada = response.data;
    } catch (error) {
      this.atividadeBuscada = null;
      this.exibirMensagemErro('Erro ao buscar atividade por ID');
    }
  }

  async reverterAtividade(atividade: Atividade) {
    try {
      const response = await axios.put(
        `${backendAPI}/revert/${atividade.id}`,
        {},
        {
          auth: { username: this.username, password: this.password },
        }
      );
      const atividadeRevertida: Atividade = response.data.data;
      atividadeRevertida.dataConclusao = null;
      this.atividadesNaoConcluidas.push(atividadeRevertida);
      this.atividadesConcluidas = this.atividadesConcluidas.filter(
        (a) => a.id !== atividade.id
      );
    } catch (error) {
      this.exibirMensagemErro('Erro ao reverter atividade');
    }
  }

  fecharModalConfirmacao() {
    this.modalConfirmacao = false;
    this.acaoConfirmada = () => {};
  }

  executarAcaoConfirmada() {
    this.acaoConfirmada();
  }

  confirmarSalvarEdicao() {
    this.acaoConfirmada = this.editarAtividade.bind(this);
    this.modalConfirmacao = true;
  }

  confirmarExcluir(id: number) {
    this.acaoConfirmada = () => this.excluirAtividade(id);
    this.modalConfirmacao = true;
  }

  abrirModalCriar() {
    this.modalCriarAberto = true;
  }

  fecharModalCriar() {
    this.modalCriarAberto = false;
    this.novaAtividade = '';
  }

  prepararEdicao(atividade: Atividade) {
    this.atividadeParaEditar = { ...atividade };
    this.modalEditarAberto = true;
  }

  fecharModalEditar() {
    this.modalEditarAberto = false;
    this.atividadeParaEditar = null;
  }

  exibirMensagemErro(mensagem: string) {
    this.mensagemErro = mensagem;
    setTimeout(() => {
      this.mensagemErro = null;
    }, 3000);
  }
}
