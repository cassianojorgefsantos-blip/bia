import React, { useState } from "react";
import Modal from "./Modal";

const AddTask = ({ onAdd }) => {
  const [titulo, setTitulo] = useState(() => localStorage.getItem("bia_nome") || "");
  const [feedback, setFeedback] = useState("");
  const [nota, setNota] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();

    if (!titulo.trim()) {
      setShowModal(true);
      return;
    }

    const sessionId = localStorage.getItem("bia_session_id");

    onAdd({
      titulo: titulo.trim(),
      dia_atividade: feedback.trim() || "",
      importante: nota >= 4,
      nota,
      session_id: sessionId,
    });

    setFeedback("");
    setNota(0);
  };

  return (
    <form className="add-form" onSubmit={onSubmit}>
      <div className="form-control">
        <label>Nome do Participante</label>
        <input
          type="text"
          placeholder="Digite seu nome aqui"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
      </div>

      <div className="form-control">
        <label>Feedback</label>
        <textarea
          placeholder="Escreva seu feedback aqui"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
        />
      </div>

      <div className="form-control">
        <label>Avaliação</label>
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star-btn ${nota >= star ? "active" : ""}`}
              onClick={() => setNota(star)}
              title={`${star} estrela${star > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
          {nota > 0 && (
            <button
              type="button"
              className="star-clear"
              onClick={() => setNota(0)}
              title="Limpar avaliação"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <button type="submit" className="btn btn-block success">
        Enviar feedback
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Campo obrigatório"
        message="Por favor, informe seu nome antes de enviar."
        type="warning"
      />
    </form>
  );
};

export default AddTask;
