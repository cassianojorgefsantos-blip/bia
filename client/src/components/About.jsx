import React from "react";
import { Link } from "react-router-dom";
import DadosHenrylle from "./DadosHenrylle.jsx";

const About = () => {
  return (
    <div className="about-page">
      <div className="about-content">
        <div className="feature-grid">
          <div className="feature-card highlight">
            <h3>Sobre</h3>
            <h4>Nave de Portas Abertas - 2026</h4>
            <p><strong>Com o tema “Conectando Futuros: Da imaginação à inovação”, o NPA 2026 convida todos a explorar como a criatividade, a tecnologia e a colaboração podem transformar ideias em novas possibilidades. Será um espaço para imaginar, experimentar, criar e refletir sobre os futuros que podemos construir juntos.</strong></p>
          </div>
        </div>

        <DadosHenrylle />
      </div>

      <div className="about-footer">
        <Link to="/" className="back-button">
          ← Voltar
        </Link>
      </div>
    </div>
  );
};

export default About;
