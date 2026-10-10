import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { FaSun, FaMoon } from "react-icons/fa";

const Cadastro = () => {
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    // Se já tem sessão, vai direto para os recados
    const sessionId = localStorage.getItem("bia_session_id");
    if (sessionId) navigate("/recados");
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("Por favor, informe seu nome.");
      return;
    }

    // Gera um session_id único para este visitante
    // crypto.randomUUID só funciona em HTTPS; fallback para HTTP
    const sessionId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("bia_session_id", sessionId);
    localStorage.setItem("bia_nome", nome.trim());

    navigate("/recados");
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>NPA 2026</h1>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDarkMode ? "Tema claro" : "Tema escuro"}
          >
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>
        </header>

        <form className="add-form cadastro-form" onSubmit={handleSubmit}>
          <div className="cadastro-intro">
            <p>Deixe seu recado para o evento! 🛸</p>
            <p className="cadastro-sub">Informe seu nome para continuar.</p>
          </div>

          <div className="form-control">
            <label>Seu nome</label>
            <input
              type="text"
              placeholder="Como você se chama?"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setErro("");
              }}
              autoFocus
            />
            {erro && <span className="form-error">{erro}</span>}
          </div>

          <button type="submit" className="btn btn-block success">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Cadastro;
