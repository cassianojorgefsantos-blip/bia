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
            <h4>REC'n'Play 2026</h4>
            <p>O REC'n'Play é um festival gratuito de inovação, tecnologia, criatividade e cultura que transforma o Bairro do Recife em um grande espaço de conhecimento e conexões.</p>
            <p>Conhecido como o “Carnaval do Conhecimento”, reúne palestras, oficinas, experiências imersivas, negócios e shows. Realizado pelo Porto Digital e pelo Sebrae Pernambuco, o festival convida pessoas de todas as áreas a aprender, experimentar e imaginar novos futuros.</p>
            <p>Confira a programação e as inscrições no <a href="https://recnplay.pe/" target="_blank" rel="noopener noreferrer" className="footer-link">site oficial do REC'n'Play</a>.</p>
          </div>
        </div>

        <DadosHenrylle />
      </div>

      <div className="about-footer">
        <Link to="/menu" className="back-button">
          ← Voltar
        </Link>
      </div>
    </div>
  );
};

export default About;
