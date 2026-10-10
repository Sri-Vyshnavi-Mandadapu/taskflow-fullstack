import taskReducer from "./state/taskReducer";
import StatCard from "./components/StatCard";
import KanbanColumn from "./components/KanbanColumn";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";
import { useBoard } from "./hooks/useBoard";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";


const THEME_KEY = "taskflow-theme";

const columns = [
  { id: "todo", title: "To Do", color: "blue" },
  { id: "in-progress", title: "In Progress", color: "orange" },
  { id: "done", title: "Done", color: "green" },
];

function App({ password, onLogout }) {
  const { tasks, dispatch, loading, saving, error, ready, reload } = useBoard(taskReducer, password);
  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || "light"
  );
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeId, setActiveId] = useState(null);
  const [modal, setModal] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const text = `${task.title} ${task.description} ${task.tags.join(" ")}`
          .toLowerCase();

        return (
          text.includes(search.toLowerCase()) &&
          (priorityFilter === "all" || task.priority === priorityFilter)
        );
      })
      .sort((a, b) => {
        if (sortBy === "newest") return b.createdAt - a.createdAt;
        if (sortBy === "oldest") return a.createdAt - b.createdAt;

        const order = { high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      });
  }, [tasks, search, priorityFilter, sortBy]);

  const counts = {
    todo: tasks.filter((task) => task.status === "todo").length,
    "in-progress": tasks.filter((task) => task.status === "in-progress").length,
    done: tasks.filter((task) => task.status === "done").length,
  };

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find((task) => task.id === active.id);
    const overTask = tasks.find((task) => task.id === over.id);

    if (!activeTask) return;

    if (overTask) {
      if (activeTask.status !== overTask.status) {
        dispatch({
          type: "MOVE_TASK",
          id: activeTask.id,
          status: overTask.status,
        });
      } else if (activeTask.id !== overTask.id) {
        dispatch({
          type: "REORDER_TASKS",
          activeId: activeTask.id,
          overId: overTask.id,
        });
      }
    } else if (columns.some((column) => column.id === over.id)) {
      dispatch({
        type: "MOVE_TASK",
        id: activeTask.id,
        status: over.id,
      });
    }
  }

  function handleAddTask(status = "todo") {
    setModal({ type: "add", status });
  }

  async function handleSaveTask(task) {
    let saved;
    if (modal.type === "add") {
      saved = await dispatch({ type: "ADD_TASK", task });
    } else {
      saved = await dispatch({ type: "UPDATE_TASK", task });
    }
    if (saved) setModal(null);
  }

  async function handleDeleteTask(id) {
    if (window.confirm("Are you sure you want to delete this task?")) {
      if (await dispatch({ type: "DELETE_TASK", id })) setModal(null);
    }
  }

  const activeTask = tasks.find((task) => task.id === activeId);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">✓</div>
          <div>
            <h1>TaskFlow</h1>
            <p>Productivity dashboard</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="secondary-button" disabled={saving} onClick={onLogout}>Sign out</button>
          <button
            className="icon-button"
            onClick={() =>
              setTheme((current) =>
                current === "light" ? "dark" : "light"
              )
            }
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === "light" ? "☾" : "☀"}
          </button>

          <button className="primary-button" disabled={!ready || loading || saving} onClick={() => handleAddTask()}>
            <span>＋</span> Add Task
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="connection-status" role="status" aria-live="polite">
          {loading ? "Loading saved tasks..." : saving ? "Saving..." : ready ? "Connected - Changes saved to MongoDB" : "Board unavailable"}
        </div>
        {error && <div className="connection-error" role="alert">{error}
          <button className="secondary-button" disabled={saving || loading} onClick={() => reload()}>Reload board</button>
        </div>}
        <div inert={!ready || loading || saving} aria-busy={loading || saving}>
        <section className="welcome-section">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h2>Good morning! 👋</h2>
            <p className="welcome-text">
              Organize your work and stay productive.
            </p>
          </div>
          <div className="date-display">
            <span>Today</span>
            <strong>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </strong>
          </div>
        </section>

        <section className="stats-grid">
          <StatCard
            icon="☷"
            label="Total Tasks"
            value={tasks.length}
            color="blue"
          />
          <StatCard
            icon="◷"
            label="In Progress"
            value={counts["in-progress"]}
            color="orange"
          />
          <StatCard
            icon="✓"
            label="Completed"
            value={counts.done}
            color="green"
          />
          <StatCard
            icon="↗"
            label="Completion Rate"
            value={`${tasks.length ? Math.round((counts.done / tasks.length) * 100) : 0}%`}
            color="purple"
          />
        </section>

        <section className="toolbar">
          <div className="search-box">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tasks"
            />
          </div>

          <div className="filter-controls">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter by priority"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort tasks"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </section>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <section className="kanban-board">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={filteredTasks.filter(
                  (task) => task.status === column.id
                )}
                totalCount={counts[column.id]}
                onEdit={(task) => setModal({ type: "edit", task })}
                onDelete={handleDeleteTask}
                onAdd={() => handleAddTask(column.id)}
              />
            ))}
          </section>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} overlay /> : null}
          </DragOverlay>
        </DndContext>
        </div>
      </main>

      {modal && (
        <TaskModal
          error={error}
          onReload={() => reload()}
          saving={saving || loading || !ready}
          mode={modal.type}
          task={modal.task}
          initialStatus={modal.status}
          onClose={() => setModal(null)}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
}

export default App;
