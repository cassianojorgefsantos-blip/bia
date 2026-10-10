import React from "react";
import { FaTimes, FaStar, FaRegStar } from "react-icons/fa";

const Task = ({ task, onDelete, onToggle, sessionId }) => {
  const nota = task.nota ?? 0;
  const isOwner = task.session_id && task.session_id === sessionId;

  return (
    <div
      className={`task ${task.importante ? "reminder" : ""}`}
      onDoubleClick={() => onToggle(task.uuid)}
    >
      <div className="task-content">
        <h3>{task.titulo}</h3>
        {task.dia_atividade && (
          <p className="task-feedback">{task.dia_atividade}</p>
        )}
        {nota > 0 && (
          <div className="task-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`star ${nota >= star ? "filled" : ""}`}>
                ★
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="task-actions">
        <button
          className="task-priority"
          onClick={() => onToggle(task.uuid)}
          title={task.importante ? "Remover destaque" : "Marcar destaque"}
        >
          {task.importante ? <FaStar /> : <FaRegStar />}
        </button>
        {isOwner && (
          <button
            className="task-delete"
            onClick={() => onDelete(task.uuid)}
            title="Excluir"
          >
            <FaTimes />
          </button>
        )}
      </div>
    </div>
  );
};

export default Task;
