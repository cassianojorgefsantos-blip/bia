import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer>
      <div className="footer-content">
        <p>NPA 2026</p>
        <Link to="/about" className="footer-link">
          Sobre
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
