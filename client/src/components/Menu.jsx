import React from 'react';
import { Link } from 'react-router-dom';
import { FaRegCommentDots, FaRegEnvelope, FaArrowRight } from 'react-icons/fa';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function Menu() {
  const nome = localStorage.getItem('bia_nome') || 'visitante';
  return <main className="container menu-container">
    <Header title="REC'n'Play 2026" />
    <section className="menu-content">
      <span className="eyebrow">ENCONTROS QUE VIRAM HISTÓRIAS</span>
      <h2>Que bom ter você aqui, {nome}.</h2>
      <p className="section-description">Compartilhe sua experiência ou dedique algumas palavras a alguém.</p>
      <div className="menu-options">
        <Link className="menu-option" to="/recados">
          <span className="menu-icon"><FaRegCommentDots aria-hidden="true" /></span>
          <h3>Feedbacks</h3><p>Conte como foi o evento e veja o que outras pessoas acharam.</p>
          <span className="menu-action">Deixar feedback <FaArrowRight aria-hidden="true" /></span>
        </Link>
        <Link className="menu-option" to="/cartas">
          <span className="menu-icon"><FaRegEnvelope aria-hidden="true" /></span>
          <h3>Cartas</h3><p>Escreva uma dedicatória e descubra mensagens que merecem ser lidas.</p>
          <span className="menu-action">Explorar cartas <FaArrowRight aria-hidden="true" /></span>
        </Link>
      </div>
    </section><Footer />
  </main>;
}
