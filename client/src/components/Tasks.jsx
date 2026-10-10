import React, { useState, useEffect } from "react";
import { FaBolt, FaDatabase, FaTrash, FaExclamationTriangle } from "react-icons/fa";
import Task from "./Task.jsx";
import Modal from "./Modal.jsx";

const Tasks = ({ tasks, onDelete, onDeleteAll, onToggle, fromCache, cacheTTL, cacheError, sessionId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [countdown, setCountdown] = useState(cacheTTL);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminErro, setAdminErro] = useState("");
  const tasksPerPage = 5;

  useEffect(() => { setCountdown(cacheTTL); }, [cacheTTL]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
  }, [tasks.length, totalPages, currentPage]);

  const goToPage = (n) => setCurrentPage(n);
  const goToPrevious = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNext = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

  const handleAdminDelete = () => {
    if (!adminKey.trim()) {
      setAdminErro("Informe a senha de admin.");
      return;
    }
    onDeleteAll(adminKey);
    setShowAdminModal(false);
    setAdminKey("");
    setAdminErro("");
  };

  const closeAdminModal = () => {
    setShowAdminModal(false);
    setAdminKey("");
    setAdminErro("");
  };

  if (tasks.length === 0) return null;

  return (
    <div className="tasks-container">
      {cacheTTL !== null && (
        <div className="data-source-badge">
          {cacheError ? (
            <span className="badge badge-error"><FaExclamationTriangle /> <FaDatabase /></span>
          ) : fromCache ? (
            <span className="badge badge-cache"><FaBolt /> {countdown}s</span>
          ) : (
            <span className="badge badge-database"><FaDatabase /></span>
          )}
        </div>
      )}

      <div className="tasks-list">
        {currentTasks.map((task) => (
          <Task
            key={task.uuid}
            task={task}
            onDelete={onDelete}
            onToggle={onToggle}
            sessionId={sessionId}
          />
        ))}
      </div>

      <div className="pagination">
        {totalPages > 1 && (
          <>
            <div className="pagination-info">
              <span>
                Mostrando {indexOfFirstTask + 1}-{Math.min(indexOfLastTask, tasks.length)} de {tasks.length} recados
              </span>
            </div>

            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={goToPrevious}
                disabled={currentPage === 1}
                title="Página anterior"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => {
                const p = i + 1;
                if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                  return (
                    <button
                      key={p}
                      className={`pagination-btn ${currentPage === p ? "active" : ""}`}
                      onClick={() => goToPage(p)}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === currentPage - 2 || p === currentPage + 2) {
                  return <span key={p} className="pagination-dots">...</span>;
                }
                return null;
              })}

              <button
                className="pagination-btn"
                onClick={goToNext}
                disabled={currentPage === totalPages}
                title="Próxima página"
              >
                ›
              </button>
            </div>
          </>
        )}

        <button
          className="btn-delete-all"
          onClick={() => setShowAdminModal(true)}
          title="Excluir todas as tarefas (requer senha de admin)"
        >
          <FaTrash /> Limpar tudo
        </button>
      </div>

      <Modal
        isOpen={showAdminModal}
        onClose={closeAdminModal}
        onConfirm={handleAdminDelete}
        title="Área restrita"
        message={
          <div>
            <p style={{ marginBottom: "0.75rem" }}>
              Informe a senha de admin para continuar:
            </p>
            <input
              type="password"
              placeholder="Senha de admin"
              value={adminKey}
              onChange={(e) => { setAdminKey(e.target.value); setAdminErro(""); }}
              style={{
                width: "100%",
                padding: "0.4rem 0.5rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
              }}
            />
            {adminErro && <span className="form-error">{adminErro}</span>}
          </div>
        }
        type="warning"
      />
    </div>
  );
};

export default Tasks;
