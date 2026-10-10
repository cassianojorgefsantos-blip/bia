import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { LogProvider, useLog } from "./contexts/LogContext.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Tasks from "./components/Tasks.jsx";
import AddTask from "./components/AddTask.jsx";
import About from "./components/About.jsx";
import Cadastro from "./components/Cadastro.jsx";
import DebugLogs from "./components/DebugLogs.jsx";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

function AppContent() {
  const [tasks, setTasks] = useState([]);
  const [fromCache, setFromCache] = useState(false);
  const [cacheTTL, setCacheTTL] = useState(null);
  const [cacheError, setCacheError] = useState(false);
  const [sessionId] = useState(() => localStorage.getItem("bia_session_id"));
  const { logApiRequest, logApiResponse, logApiError, addLog } = useLog();

  useEffect(() => {
    addLog("INFO", "Aplicação iniciada", `API URL configurada: ${apiUrl}`);
    getTasks();
  }, []);

  const getTasks = async () => {
    try {
      const response = await fetchTasks();
      if (response.data) {
        setTasks(response.data);
        setFromCache(response.fromCache);
        setCacheTTL(response.cacheTTL);
        setCacheError(response.cacheError || false);
      } else {
        setTasks(response);
        setFromCache(false);
        setCacheTTL(null);
        setCacheError(false);
      }
    } catch (error) {
      addLog("ERROR", "Falha ao carregar recados", error.message);
    }
  };

  const fetchTasks = async () => {
    const url = `${apiUrl}/api/tarefas`;
    logApiRequest("GET", url);
    try {
      const res = await fetch(url);
      const data = await res.json();
      logApiResponse("GET", url, res.status, data);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return data;
    } catch (error) {
      logApiError("GET", url, error);
      throw error;
    }
  };

  const fetchTask = async (uuid) => {
    const url = `${apiUrl}/api/tarefas/${uuid}`;
    logApiRequest("GET", url);
    try {
      const res = await fetch(url);
      const data = await res.json();
      logApiResponse("GET", url, res.status, data);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return data;
    } catch (error) {
      logApiError("GET", url, error);
      throw error;
    }
  };

  const toggleReminder = async (uuid) => {
    try {
      const taskToToggle = await fetchTask(uuid);
      const updatedTask = { ...taskToToggle, importante: !taskToToggle.importante };
      const url = `${apiUrl}/api/tarefas/update_priority/${uuid}`;
      logApiRequest("PUT", url, updatedTask);
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(updatedTask),
      });
      const data = await res.json();
      logApiResponse("PUT", url, res.status, data);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      setTasks(tasks.map((task) => task.uuid === uuid ? { ...task, importante: data.importante } : task));
      addLog("SUCCESS", "Destaque alterado", `Recado ${uuid} - Importante: ${data.importante}`);
    } catch (error) {
      addLog("ERROR", "Falha ao alterar destaque", error.message);
    }
  };

  const addTask = async (task) => {
    const url = `${apiUrl}/api/tarefas`;
    logApiRequest("POST", url, task);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(task),
      });
      const data = await res.json();
      logApiResponse("POST", url, res.status, data);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      setTasks([...tasks, data]);
      addLog("SUCCESS", "Recado enviado", `"${task.titulo}" adicionado com sucesso`);
    } catch (error) {
      logApiError("POST", url, error);
      addLog("ERROR", "Falha ao enviar recado", error.message);
    }
  };

  const deleteTask = async (uuid) => {
    const url = `${apiUrl}/api/tarefas/${uuid}`;
    logApiRequest("DELETE", url);
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "x-session-id": sessionId || "",
        },
      });
      logApiResponse("DELETE", url, res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      setTasks(tasks.filter((task) => task.uuid !== uuid));
      addLog("SUCCESS", "Recado removido", `Recado ${uuid} excluído`);
    } catch (error) {
      logApiError("DELETE", url, error);
      addLog("ERROR", "Falha ao excluir recado", error.message);
    }
  };

  const deleteAllTasks = async (adminKey) => {
    const url = `${apiUrl}/api/tarefas`;
    logApiRequest("DELETE", url);
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      logApiResponse("DELETE", url, res.status);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      setTasks([]);
      addLog("SUCCESS", "Todos os recados removidos");
      getTasks();
    } catch (error) {
      logApiError("DELETE", url, error);
      addLog("ERROR", "Falha ao limpar recados", error.message);
    }
  };

  const RecadosPage = () => (
    <>
      <AddTask onAdd={addTask} />
      {tasks.length > 0 ? (
        <Tasks
          tasks={tasks}
          onDelete={deleteTask}
          onDeleteAll={deleteAllTasks}
          onToggle={toggleReminder}
          fromCache={fromCache}
          cacheTTL={cacheTTL}
          cacheError={cacheError}
          sessionId={sessionId}
        />
      ) : (
        <div className="empty-state">
          <h3>Nenhum recado ainda. Seja o primeiro! 🛸</h3>
        </div>
      )}
    </>
  );

  return (
    <div className="app">
      <Router>
        <Routes>
          <Route path="/" element={<Cadastro />} />
          <Route
            path="/recados"
            element={
              <div className="container">
                <Header />
                <RecadosPage />
                <Footer />
              </div>
            }
          />
          <Route
            path="/about"
            element={
              <div className="container">
                <Header />
                <About />
                <Footer />
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <DebugLogs />
      </Router>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LogProvider>
        <AppContent />
      </LogProvider>
    </ThemeProvider>
  );
}

export default App;
