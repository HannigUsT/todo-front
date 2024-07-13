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
  title = 'Quadro de Atividades';
  username = 'employee';
  password = 'employee_password';
  atividadesNaoConcluidas: Atividade[] = [];
  atividadesConcluidas: Atividade[] = [];
  novaAtividade = '';
  atividadeBuscada: Atividade | null = null;
  modalCriarAberto = false;
  modalEditarAberto = false;
  atividadeParaEditar: Atividade | null = null;
  mensagemErro: string | null = null;

  ngOnInit(): void {
    this.buscarAtividades();
  }

  async buscarAtividades() {
    try {
      const unfinishedResponse = await axios.get(`${backendAPI}/unfinished`, {
        auth: { username: this.username, password: this.password },
      });

      this.atividadesNaoConcluidas = unfinishedResponse.data.data;

      const finishedResponse = await axios.get(`${backendAPI}/finished`, {
        auth: { username: this.username, password: this.password },
      });
      this.atividadesConcluidas = finishedResponse.data;
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
      await this.buscarAtividades(); // Atualiza a lista após criar a atividade
    } catch (error) {
      this.exibirMensagemErro('Erro ao criar atividade');
    }
  }

  async concluirAtividade(id: number) {
    try {
      const response = await axios.put(`${backendAPI}/finish/${id}`, null, {
        auth: { username: this.username, password: this.password },
      });

      const atividade = this.atividadesNaoConcluidas.find((a) => a.id === id);
      if (atividade) {
        atividade.conclusao = true;
        atividade.dataConclusao = response.data.dataConclusao;
        this.atividadesConcluidas.push(atividade);
        this.atividadesNaoConcluidas = this.atividadesNaoConcluidas.filter(
          (a) => a.id !== id
        );
      }
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

      this.atividadesNaoConcluidas = this.atividadesNaoConcluidas.map((a) =>
        a.id === this.atividadeParaEditar?.id ? response.data : a
      );
      this.fecharModalEditar();
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

  async reverterAtividade(id: number) {
    try {
      const response = await axios.put(`${backendAPI}/revert/${id}`, null, {
        auth: { username: this.username, password: this.password },
      });

      if (response.data && response.data.data) {
        const atividade = response.data.data;
        this.atividadesConcluidas = this.atividadesConcluidas.filter(
          (a) => a.id !== id
        );
        this.atividadesNaoConcluidas.push(atividade);
      }
    } catch (error) {
      console.error('Erro ao reverter atividade', error);
      this.exibirMensagemErro('Erro ao reverter atividade');
    }
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
