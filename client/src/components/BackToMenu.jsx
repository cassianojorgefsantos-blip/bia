import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
export default function BackToMenu() {
  return <nav className="page-navigation" aria-label="Navegação da página">
    <Link className="menu-back" to="/menu"><FaArrowLeft aria-hidden="true" /> Voltar ao menu</Link>
  </nav>;
}
